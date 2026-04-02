import type { Finding, RawRule } from "./types";

// AST-based heuristics implemented as targeted regex/structural patterns.
// Full tree-sitter integration is a Phase 2 upgrade; these patterns have
// very low false-positive rates on real AI-generated code.

interface AstPattern {
  call?: string | string[];
  node?: string;
  prop?: string;
  identifier?: string;
  argSource?: string[];
  argContains?: string[];
  argType?: string;
  missing?: string[];
  missingPair?: string;
  missingFlags?: string[];
  missingAuth?: boolean;
  missingValidation?: boolean;
  directResponse?: boolean;
  corsConfig?: Record<string, unknown>;
  valueSource?: string[];
  context?: string;
  responseContains?: string[];
  method?: string;
}

function getSnippet(lines: string[], lineIndex: number): string {
  const start = Math.max(0, lineIndex - 1);
  const end = Math.min(lines.length - 1, lineIndex + 1);
  return lines.slice(start, end + 1).join("\n");
}

function makeRegex(patterns: string[]): RegExp {
  return new RegExp(patterns.join("|"), "i");
}

// Per-rule heuristic matchers
const AST_MATCHERS: Record<
  string,
  (code: string, lines: string[]) => number[]
> = {
  "supabase-key-client": (code) => {
    // Service role key used with createClient in any non-API context
    const matches: number[] = [];
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      if (
        /SUPABASE_SERVICE_ROLE_KEY/i.test(line) &&
        !/\/\/ server-only|api route/i.test(line)
      ) {
        matches.push(i);
      }
    });
    return matches;
  },

  "env-in-client": (code) => {
    const matches: number[] = [];
    const lines = code.split("\n");
    const isClientFile =
      /['"]use client['"]/i.test(code) ||
      /^(import|export).*from ['"]react['"]/m.test(code);
    if (!isClientFile) return [];
    lines.forEach((line, i) => {
      if (
        /process\.env\.[A-Z_]+/.test(line) &&
        !/NEXT_PUBLIC_/.test(line) &&
        !/\/\//.test(line.trim().slice(0, 2))
      ) {
        matches.push(i);
      }
    });
    return matches;
  },

  "missing-auth-api": (code) => {
    // Route handler that exports GET/POST without any auth check
    const hasHandler =
      /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/m.test(code);
    if (!hasHandler) return [];
    const hasAuth = makeRegex([
      "getServerSession",
      "auth\\(\\)",
      "getUser",
      "currentUser",
      "verifyToken",
      "requireAuth",
      "session\\.user",
    ]).test(code);
    if (hasAuth) return [];
    // Return line number of the handler
    const lines = code.split("\n");
    const idx = lines.findIndex((l) =>
      /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/.test(l)
    );
    return idx >= 0 ? [idx] : [];
  },

  "jwt-no-verify": (code) => {
    if (!/jwt\.decode\(/i.test(code)) return [];
    if (/jwt\.verify\(/i.test(code)) return [];
    const lines = code.split("\n");
    return lines.reduce<number[]>((acc, line, i) => {
      if (/jwt\.decode\(/i.test(line)) acc.push(i);
      return acc;
    }, []);
  },

  "sql-interpolation": (code) => {
    const matches: number[] = [];
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      if (
        /\.(query|raw|execute)\s*\(/.test(line) &&
        /`[^`]*\$\{/.test(line)
      ) {
        matches.push(i);
      }
    });
    return matches;
  },

  "nosql-injection": (code) => {
    const matches: number[] = [];
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      if (
        /\.(find|findOne|updateOne|deleteOne)\s*\(/.test(line) &&
        /req\.(body|query|params)/.test(line)
      ) {
        matches.push(i);
      }
    });
    return matches;
  },

  "xss-dangerously": (code) => {
    const matches: number[] = [];
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      if (/dangerouslySetInnerHTML/.test(line) && /\{/.test(line)) {
        matches.push(i);
      }
    });
    return matches;
  },

  "eval-usage": (code) => {
    const matches: number[] = [];
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      if (
        /\beval\s*\(/.test(line) ||
        /new\s+Function\s*\(/.test(line)
      ) {
        matches.push(i);
      }
    });
    return matches;
  },

  "command-injection": (code) => {
    const matches: number[] = [];
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      if (
        /\b(exec|execSync|spawn|spawnSync)\s*\(/.test(line) &&
        /`[^`]*\$\{/.test(line)
      ) {
        matches.push(i);
      }
    });
    return matches;
  },

  "cors-credentials-wildcard": (code) => {
    const hasCreds = /credentials\s*:\s*true/i.test(code);
    const hasWildcard =
      /origin\s*:\s*['"]?\*['"]?/.test(code) ||
      /origin\s*:\s*true/i.test(code);
    if (!hasCreds || !hasWildcard) return [];
    const lines = code.split("\n");
    const idx = lines.findIndex((l) => /credentials\s*:\s*true/i.test(l));
    return idx >= 0 ? [idx] : [];
  },

  "full-error-client": (code) => {
    const matches: number[] = [];
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      if (
        /catch\s*\(/.test(line) ||
        (/json\s*\(/.test(line) &&
          /error\.(stack|message)|e\.(stack|message)/.test(line))
      ) {
        if (/error\.(stack|message)|e\.(stack|message)/.test(line)) {
          matches.push(i);
        }
      }
    });
    return matches;
  },

  "console-log-sensitive": (code) => {
    const matches: number[] = [];
    const lines = code.split("\n");
    const sensitiveVars =
      /password|token|secret|apikey|api_key|credential|private_key/i;
    lines.forEach((line, i) => {
      if (/console\.log\s*\(/.test(line) && sensitiveVars.test(line)) {
        matches.push(i);
      }
    });
    return matches;
  },

  "unfiltered-query": (code) => {
    const matches: number[] = [];
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      if (/\.select\s*\(\s*['"`]\*['"`]\s*\)/.test(line)) {
        matches.push(i);
      }
    });
    return matches;
  },

  "no-input-validation": (code) => {
    // API route that reads req body/query without zod/joi/yup
    const hasHandler =
      /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/m.test(code);
    if (!hasHandler) return [];
    const hasValidation =
      /\.parse\s*\(|\.safeParse\s*\(|\.validate\s*\(|z\.\w|joi\.|yup\./i.test(
        code
      );
    if (hasValidation) return [];
    const hasBodyRead =
      /request\.json\(\)|req\.body|await request\.formData/.test(code);
    if (!hasBodyRead) return [];
    const lines = code.split("\n");
    const idx = lines.findIndex((l) =>
      /request\.json\(\)|req\.body|await request\.formData/.test(l)
    );
    return idx >= 0 ? [idx] : [];
  },

  "unvalidated-redirect": (code) => {
    const matches: number[] = [];
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      if (
        /\b(redirect|router\.push|Response\.redirect)\s*\(/.test(line) &&
        /searchParams|req\.query|req\.body|params\[/.test(line)
      ) {
        matches.push(i);
      }
    });
    return matches;
  },

  "insecure-cookie": (code) => {
    const matches: number[] = [];
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      if (/cookies\(\)\.(set|append)|setCookie\s*\(/.test(line)) {
        // Check nearby lines for missing flags
        const block = lines
          .slice(i, Math.min(lines.length, i + 5))
          .join("\n");
        const hasHttpOnly = /httpOnly\s*:\s*true/i.test(block);
        const hasSecure = /secure\s*:\s*true/i.test(block);
        if (!hasHttpOnly || !hasSecure) {
          matches.push(i);
        }
      }
    });
    return matches;
  },

  "no-csrf": (code) => {
    const matches: number[] = [];
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      if (
        /<form[^>]*method\s*=\s*['"]?post/i.test(line) &&
        !/(csrf|_token|csrfToken)/i.test(code)
      ) {
        matches.push(i);
      }
    });
    return matches;
  },

  "missing-rls": (code) => {
    const matches: number[] = [];
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      if (
        /supabase\.from\s*\(/.test(line) &&
        /service_role|serviceRole|SERVICE_ROLE/i.test(code)
      ) {
        matches.push(i);
      }
    });
    return matches;
  },
};

export function runAstRule(
  rule: RawRule,
  code: string,
  filePath: string
): Finding[] {
  const matcher = AST_MATCHERS[rule.id];
  if (!matcher) return [];

  const lines = code.split("\n");
  const matchedLines = matcher(code, lines);

  return matchedLines.map((lineIdx) => ({
    ruleId: rule.id,
    filePath,
    lineNumber: lineIdx + 1,
    lineEnd: lineIdx + 1,
    codeSnippet: getSnippet(lines, lineIdx),
    severity: rule.severity,
    category: rule.category,
    title: rule.title,
    description: rule.description,
    aiTools: rule.aiTools,
    fixTemplate: rule.fixTemplate,
  }));
}
