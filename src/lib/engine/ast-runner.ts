import type { Finding, RawRule } from "./types";

// AST-based heuristics: targeted structural patterns that understand code context.
// Each matcher receives the full file code, split lines, and file path for
// path-aware analysis. Returns 0-indexed line numbers where the issue is found.

function getSnippet(lines: string[], lineIndex: number): string {
  const start = Math.max(0, lineIndex - 2);
  const end = Math.min(lines.length - 1, lineIndex + 2);
  return lines.slice(start, end + 1).join("\n");
}

function makeRegex(patterns: string[]): RegExp {
  return new RegExp(patterns.join("|"), "i");
}

/**
 * Strip the *contents* of string and regex literals from a line so that
 * pattern-matching rules don't fire on pattern strings stored as data
 * (e.g. rule definition files, seed files containing regex strings).
 */
function stripLiteralContents(line: string): string {
  return line
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')          // double-quoted strings
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")           // single-quoted strings
    .replace(/`(?:[^`\\]|\\.)*`/g, "``")           // template literals
    .replace(/\/(?:[^/\\\n]|\\.)+\/[gimsuy]*/g, "/re/"); // regex literals
}

/** Is this file a React client component? */
function isClientComponent(code: string): boolean {
  return /^\s*['"]use client['"]/m.test(code);
}

/** Is this file a Next.js API route? */
function isApiRoute(filePath: string): boolean {
  return /\/api\//.test(filePath) || /route\.[jt]sx?$/.test(filePath);
}

/** Is this path an intentionally public/unauthenticated endpoint? */
function isPublicApiPath(filePath: string): boolean {
  return /\/api\/auth\/|\/api\/webhooks?\/|\/api\/public\/|\/api\/health|\/api\/ping|\/api\/oauth/.test(
    filePath
  );
}

/** Is this file a test or fixture? Skip it. */
function isTestFile(filePath: string): boolean {
  return /\.(test|spec)\.[jt]sx?$|__tests__|fixtures?\/|mocks?\//i.test(filePath);
}

/** Find all 0-indexed lines matching a regex */
function matchLines(lines: string[], re: RegExp): number[] {
  return lines.reduce<number[]>((acc, line, i) => {
    if (re.test(line)) acc.push(i);
    return acc;
  }, []);
}

// ─── Per-rule matchers ────────────────────────────────────────────────────────

const AST_MATCHERS: Record<
  string,
  (code: string, lines: string[], filePath: string) => number[]
> = {
  // ── Secrets ──────────────────────────────────────────────────────────────

  "supabase-key-client": (code, lines, filePath) => {
    // Service role key used outside of server-only files
    if (isTestFile(filePath)) return [];
    if (isApiRoute(filePath)) return []; // allowed in API routes
    // Only flag when the key name appears as actual code, not inside a
    // string/regex literal (which would be a pattern-definition file).
    return matchLines(lines, /SUPABASE_SERVICE_ROLE_KEY/i).filter(
      (i) => /SUPABASE_SERVICE_ROLE_KEY/i.test(stripLiteralContents(lines[i]))
    );
  },

  "env-in-client": (code, lines, filePath) => {
    // process.env without NEXT_PUBLIC_ in a client component
    if (!isClientComponent(code)) return [];
    if (isApiRoute(filePath)) return [];
    return matchLines(
      lines,
      /process\.env\.(?!NEXT_PUBLIC_)[A-Z_]+/
    ).filter((i) => !/^\s*\/\//.test(lines[i]));
  },

  // ── Authentication ────────────────────────────────────────────────────────

  "missing-auth-api": (code, lines, filePath) => {
    // Route handler without any recognisable auth check
    if (isTestFile(filePath)) return [];
    if (!isApiRoute(filePath)) return [];
    if (isPublicApiPath(filePath)) return [];

    const hasHandler =
      /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/m.test(code);
    if (!hasHandler) return [];

    const AUTH_PATTERNS = [
      // next-auth v4 / v5
      "getServerSession", "auth\\(\\)",
      // Supabase
      "getUser\\(", "supabase\\.auth\\.",
      // Clerk
      "currentUser\\(", "getAuth\\(", "clerkClient", "auth\\(\\)\\.userId",
      // Lucia / custom
      "validateSession", "locals\\.user", "checkAuth", "requireAuth",
      "withAuth", "isAuthenticated", "ensureAuth",
      // Session / JWT
      "session\\.user", "session\\.userId", "token\\.sub",
      "verifyToken", "verifyJwt", "jwt\\.verify",
    ];
    if (makeRegex(AUTH_PATTERNS).test(code)) return [];

    // Only flag if the route touches sensitive data (skip static GET-only routes)
    const hasSensitiveOp = makeRegex([
      "request\\.json", "req\\.body", "request\\.formData",
      "prisma\\.", "\\.create\\(", "\\.update\\(", "\\.delete\\(",
      "\\.findUnique\\(", "\\.findMany\\(", "\\.findFirst\\(",
      "db\\.", "supabase\\.", "DELETE|UPDATE|INSERT",
    ]).test(code);

    const isGetOnly =
      /export\s+(async\s+)?function\s+GET/.test(code) &&
      !/export\s+(async\s+)?function\s+(POST|PUT|DELETE|PATCH)/.test(code);

    if (isGetOnly && !hasSensitiveOp) return [];

    const idx = lines.findIndex((l) =>
      /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/.test(l)
    );
    return idx >= 0 ? [idx] : [];
  },

  "jwt-no-verify": (code, lines) => {
    if (!/jwt\.decode\(/i.test(code)) return [];
    if (/jwt\.verify\(/i.test(code)) return [];
    return matchLines(lines, /jwt\.decode\(/i);
  },

  "cors-credentials-wildcard": (code, lines) => {
    const hasCreds = /credentials\s*:\s*true/i.test(code);
    const hasWildcard =
      /origin\s*:\s*['"]?\*['"]?/.test(code) ||
      /origin\s*:\s*true/i.test(code);
    if (!hasCreds || !hasWildcard) return [];
    const idx = lines.findIndex((l) => /credentials\s*:\s*true/i.test(l));
    return idx >= 0 ? [idx] : [];
  },

  // ── Injection ─────────────────────────────────────────────────────────────

  "sql-interpolation": (code, lines) => {
    return matchLines(
      lines,
      /\.(query|raw|execute)\s*\(`[^`]*\$\{/
    );
  },

  "nosql-injection": (code, lines) => {
    return matchLines(
      lines,
      /\.(find|findOne|updateOne|deleteOne)\s*\([^)]*req\.(body|query|params)/
    );
  },

  "xss-dangerously": (code, lines) => {
    // Only flag when the value comes from a variable, not a hardcoded string
    return matchLines(lines, /dangerouslySetInnerHTML\s*=\s*\{\s*\{/).filter(
      (i) => {
        const snippet = lines.slice(i, Math.min(lines.length, i + 3)).join(" ");
        // Skip if the value is a hardcoded string literal
        return !/__html\s*:\s*['"`][^'"`]*['"`]/.test(snippet);
      }
    );
  },

  "eval-usage": (code, lines) => {
    // Strip string/regex literal contents first so pattern definition files
    // (seed.ts, rules.ts) don't produce false positives for storing "eval("
    // as a string value in rule data.
    return matchLines(lines, /\beval\s*\(|new\s+Function\s*\(/).filter(
      (i) => /\beval\s*\(|new\s+Function\s*\(/.test(stripLiteralContents(lines[i]))
    );
  },

  "command-injection": (code, lines) => {
    // exec/spawn with a template literal (interpolated argument = injection risk)
    return matchLines(
      lines,
      /\b(exec|execSync|spawn|spawnSync)\s*\(`[^`]*\$\{/
    );
  },

  // ── Data exposure ─────────────────────────────────────────────────────────

  "full-error-client": (code, lines) => {
    return matchLines(
      lines,
      /(?:error|err|e)\.(stack|message)\b/
    ).filter((i) => {
      // Must be inside a response / json call context
      const block = lines
        .slice(Math.max(0, i - 3), Math.min(lines.length, i + 3))
        .join(" ");
      return /(?:json|send|write|response)\s*\(/.test(block);
    });
  },

  "console-log-sensitive": (code, lines) => {
    const sensitiveVars =
      /password|token|secret|apikey|api_key|credential|private_?key|bearer/i;
    return matchLines(lines, /console\.log\s*\(/).filter((i) =>
      sensitiveVars.test(lines[i])
    );
  },

  "unfiltered-query": (code, lines) => {
    return matchLines(lines, /\.select\s*\(\s*['"`]\*['"`]\s*\)/);
  },

  // ── Config ────────────────────────────────────────────────────────────────

  "no-input-validation": (code, lines, filePath) => {
    if (!isApiRoute(filePath)) return [];
    const hasHandler =
      /export\s+(async\s+)?function\s+(POST|PUT|PATCH|DELETE)/m.test(code);
    if (!hasHandler) return [];
    const hasValidation =
      /\.parse\s*\(|\.safeParse\s*\(|\.validate\s*\(|z\.\w|joi\.|yup\.|ajv/i.test(
        code
      );
    if (hasValidation) return [];
    const hasBodyRead = /request\.json\(\)|req\.body|await request\.formData/.test(code);
    if (!hasBodyRead) return [];
    const idx = lines.findIndex((l) =>
      /request\.json\(\)|req\.body|await request\.formData/.test(l)
    );
    return idx >= 0 ? [idx] : [];
  },

  "unvalidated-redirect": (code, lines) => {
    return matchLines(
      lines,
      /\b(?:redirect|router\.push|Response\.redirect)\s*\([^)]*(?:searchParams|req\.query|req\.body|params\[)/
    );
  },

  "insecure-cookie": (code, lines) => {
    return matchLines(lines, /cookies\(\)\.(set|append)\s*\(|setCookie\s*\(/).filter((i) => {
      const block = lines
        .slice(i, Math.min(lines.length, i + 6))
        .join("\n");
      const hasHttpOnly = /httpOnly\s*:\s*true/i.test(block);
      const hasSecure = /secure\s*:\s*true/i.test(block);
      return !hasHttpOnly || !hasSecure;
    });
  },

  "no-csrf": (code, lines) => {
    if (/(csrf|_token|csrfToken|SameSite)/i.test(code)) return [];
    return matchLines(lines, /<form[^>]*method\s*=\s*['"]?post/i);
  },

  "missing-rls": (code, lines) => {
    if (!/service_role|serviceRole|SERVICE_ROLE/i.test(code)) return [];
    return matchLines(lines, /supabase\.from\s*\(/);
  },

  // ── NEW: Gap rules ────────────────────────────────────────────────────────

  /**
   * Math.random() used for security-sensitive token/code generation.
   * Math.random() is NOT cryptographically secure — it's predictable.
   */
  "insecure-randomness": (_code, lines) => {
    return matchLines(lines, /Math\.random\s*\(\)/).filter((i) => {
      const ctx = lines
        .slice(Math.max(0, i - 3), Math.min(lines.length, i + 3))
        .join("\n");
      return /\b(?:token|otp|code|nonce|salt|reset|invite|secret|session|csrf|key)\s*(?:=|:)/i.test(ctx);
    });
  },

  /**
   * Redirect destination taken from callbackUrl / redirectTo without origin validation.
   * Attacker sends ?callbackUrl=https://evil.com to phish users post-login.
   */
  "auth-callbackurl-redirect": (code, lines) => {
    return matchLines(
      lines,
      /(?:redirect|NextResponse\.redirect|router\.(?:push|replace))\s*\([^)]*(?:callbackUrl|redirectTo|returnUrl|return_url|next)\b/i
    ).filter((i) => {
      const ctx = lines
        .slice(Math.max(0, i - 8), Math.min(lines.length, i + 2))
        .join("\n");
      return /searchParams|req\.query|params\./i.test(ctx);
    });
  },

  /**
   * Security-sensitive string compared with === / !==.
   * === short-circuits on first differing byte — timing oracle for token brute-force.
   */
  "timing-attack": (_code, lines) => {
    return matchLines(lines, /[!=]==/).filter((i) => {
      const line = lines[i];
      return (
        /\b(?:token|signature|secret|hmac|hash|digest|passwordHash|resetToken|apiKey|api_key)\b/i.test(line) &&
        !/timingSafeEqual|crypto\.subtle/.test(line) &&
        !/^\s*\/\//.test(line)
      );
    });
  },

  /**
   * Server-side fetch() called with a URL that comes from user-controlled input.
   * Attacker can point the server at internal services: AWS metadata, Redis, internal APIs.
   */
  "ssrf": (_code, lines, filePath) => {
    if (!isApiRoute(filePath)) return [];
    return matchLines(lines, /\bfetch\s*\(/).filter((i) => {
      const line = lines[i];
      // Skip obvious static URLs
      if (/fetch\s*\(\s*['"`]https?:\/\//.test(line)) return false;
      if (/process\.env\.NEXT_PUBLIC_/.test(line)) return false;
      // Look for user-controlled value in surrounding context
      const ctx = lines
        .slice(Math.max(0, i - 10), Math.min(lines.length, i + 2))
        .join("\n");
      return /(?:body|req\.(?:query|body|params)|searchParams|params)\s*[.[]/i.test(ctx);
    });
  },

  /**
   * fs/path operations with user-controlled path components.
   * path.join() does NOT prevent ../ traversal — validate after joining.
   */
  "path-traversal": (_code, lines, filePath) => {
    if (!isApiRoute(filePath)) return [];
    const userInputRe =
      /(?:body|req\.(?:body|query|params)|searchParams|params)\s*[.[]/;
    const fsRe =
      /(?:readFile|writeFile|readFileSync|writeFileSync|createReadStream|createWriteStream|unlink|unlinkSync)\s*\(/;
    const pathRe = /path\.(?:join|resolve)\s*\(/;

    return [
      ...matchLines(lines, fsRe).filter((i) => {
        const ctx = lines
          .slice(Math.max(0, i - 6), Math.min(lines.length, i + 3))
          .join("\n");
        return userInputRe.test(ctx);
      }),
      ...matchLines(lines, pathRe).filter((i) => {
        const ctx = lines
          .slice(Math.max(0, i - 4), Math.min(lines.length, i + 4))
          .join("\n");
        return userInputRe.test(ctx);
      }),
    ];
  },

  /**
   * NEXT_PUBLIC_ prefix used on environment variables that should stay server-only.
   * Next.js bakes NEXT_PUBLIC_ values into the client bundle at build time.
   */
  "nextpublic-secret": (_code, lines) => {
    return matchLines(
      lines,
      /NEXT_PUBLIC_(?:SECRET|PRIVATE|PASSWORD|DATABASE|SERVICE_ROLE|ADMIN|INTERNAL|TOKEN|API_SECRET|WEBHOOK)/i
    ).filter((i) => !/^\s*\/\//.test(lines[i]));
  },

  /**
   * Auth token stored in localStorage — accessible to any JavaScript on the page.
   * XSS becomes immediate account takeover. Use httpOnly cookies instead.
   */
  "localstorage-auth-token": (_code, lines) => {
    return matchLines(
      lines,
      /localStorage\.setItem\s*\([^)]*(?:token|jwt|access_token|auth_token|session_token|authToken|sessionToken|accessToken)/i
    );
  },

  /**
   * API routes that return user-specific data but don't set Cache-Control: no-store.
   * Shared or CDN caches can serve one user's data to another.
   */
  "missing-cache-control": (code, lines, filePath) => {
    if (!isApiRoute(filePath)) return [];
    const hasUserQuery =
      /where\s*:\s*\{[^}]*(?:createdById|userId|ownerId|authorId)\s*:\s*session\.user/.test(
        code
      );
    if (!hasUserQuery) return [];
    if (/[Cc]ache-[Cc]ontrol|no-store|no-cache/i.test(code)) return [];
    const idx = lines.findIndex((l) => /NextResponse\.json\s*\(/.test(l));
    return idx >= 0 ? [idx] : [];
  },

  /**
   * Email sender fields (to, from, subject, cc) sourced directly from request body.
   * Attacker injects \r\n into subject/to fields to add headers and spam via your server.
   */
  "email-header-injection": (code, lines, filePath) => {
    if (!isApiRoute(filePath)) return [];
    if (!/nodemailer|@sendgrid|resend|postmark|mailgun/i.test(code)) return [];
    return matchLines(
      lines,
      /(?:^|\s)(?:to|from|cc|bcc|subject)\s*:\s*(?:body\.|data\.|payload\.|req\.body\.)\w+/i
    );
  },

  /**
   * File upload handler that accepts any file without MIME type or size validation.
   * Attackers upload executables, polyglot files, or multi-GB files to crash the server.
   */
  "file-upload-no-validation": (code, lines, filePath) => {
    if (!isApiRoute(filePath)) return [];
    if (!/(formData|upload|file)/i.test(code)) return [];
    if (!/\.formData\s*\(\)|formData\.get\s*\(/.test(code)) return [];
    if (/\.type\b|\.size\b|mimetype|contentType|allowedTypes|ALLOWED_|maxSize/i.test(code)) return [];
    const idx = lines.findIndex((l) => /\.formData\s*\(\)|formData\.get\s*\(/.test(l));
    return idx >= 0 ? [idx] : [];
  },

  /**
   * new RegExp() constructed from user-controlled input.
   * Crafted patterns can cause catastrophic backtracking that blocks the Node.js event loop.
   */
  "redos-regexp": (_code, lines, filePath) => {
    if (!isApiRoute(filePath)) return [];
    return matchLines(lines, /new\s+RegExp\s*\(/).filter((i) => {
      const ctx = lines
        .slice(Math.max(0, i - 6), Math.min(lines.length, i + 2))
        .join("\n");
      return /(?:body|req\.(?:query|body|params)|searchParams|params)\s*[.[]/i.test(ctx);
    });
  },

  /**
   * prisma.$queryRaw() used as a function call with a template literal argument (unsafe).
   * Safe form: prisma.$queryRaw`...` (tagged template — Prisma parameterizes it).
   * Unsafe form: prisma.$queryRaw(`SELECT ... ${id}`) — string interpolation = SQL injection.
   */
  "queryraw-string-concat": (_code, lines) => {
    return [
      // $queryRaw( with backtick = call form (NOT tagged template) = unsafe
      ...matchLines(lines, /\$(?:queryRaw|executeRaw)\s*\(`/),
      // $queryRaw("SELECT" + variable) — string concatenation
      ...matchLines(lines, /\$(?:queryRaw|executeRaw)\s*\([^`][^)]*\+\s*\w/),
    ];
  },

  /**
   * Security-sensitive values passed in URL query parameters.
   * These appear in server logs, browser history, and Referer headers of linked sites.
   */
  "sensitive-in-query-param": (_code, lines) => {
    return [
      ...matchLines(lines, /[?&](?:token|secret|password|api[_-]?key|auth)[=&]/i),
      ...matchLines(
        lines,
        /searchParams\.(?:set|append)\s*\(\s*['"](?:token|secret|password|api[_-]?key|auth)['"]/i
      ),
    ];
  },

  /**
   * Cookie set without sameSite attribute.
   * Without sameSite, cookies are sent on cross-origin requests,
   * enabling CSRF even without a traditional form submission vector.
   */
  "missing-samesite-cookie": (_code, lines) => {
    return matchLines(
      lines,
      /cookies\(\)\.(set|append)\s*\(|setCookie\s*\(/
    ).filter((i) => {
      const block = lines
        .slice(i, Math.min(lines.length, i + 8))
        .join("\n");
      return !/sameSite\s*:/i.test(block);
    });
  },

  /**
   * Webhook handler that parses the request body without verifying the signature.
   * Anyone can POST fake events to trigger subscription upgrades, order fulfilment, etc.
   */
  "webhook-no-verify": (code, lines, filePath) => {
    if (!/webhook/i.test(filePath)) return [];
    if (!isApiRoute(filePath)) return [];
    if (
      !/request\.json\(\)|await\s+(?:req|request)\.text\(\)|readBody|req\.body/i.test(
        code
      )
    )
      return [];
    if (
      /constructEvent|\.verify\s*\(|timingSafeEqual|x-hub-signature|svix-signature|stripe\.webhooks|webhook\.verify|verifySignature/i.test(
        code
      )
    )
      return [];
    const idx = lines.findIndex((l) =>
      /export\s+(async\s+)?function\s+POST/.test(l)
    );
    return idx >= 0 ? [idx] : [];
  },
};

// ─── Public runner ────────────────────────────────────────────────────────────

export function runAstRule(
  rule: RawRule,
  code: string,
  filePath: string
): Finding[] {
  // Respect file-level suppression comment
  if (/vibescan-disable-file/.test(code)) return [];

  const matcher = AST_MATCHERS[rule.id];
  if (!matcher) return [];

  const lines = code.split("\n");
  const matchedLines = matcher(code, lines, filePath); // ← filePath now passed

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
    riskCategories: [],  // enriched by scan-files.ts via getRiskCategories()
  }));
}
