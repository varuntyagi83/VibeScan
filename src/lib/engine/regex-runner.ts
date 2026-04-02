import type { Finding, RawRule } from "./types";

function getSnippet(lines: string[], lineIndex: number): string {
  const start = Math.max(0, lineIndex - 1);
  const end = Math.min(lines.length - 1, lineIndex + 1);
  return lines.slice(start, end + 1).join("\n");
}

export function runRegexRule(
  rule: RawRule,
  code: string,
  filePath: string
): Finding[] {
  const pattern = rule.pattern as { regex: string };
  if (!pattern?.regex) return [];

  let regex: RegExp;
  try {
    regex = new RegExp(pattern.regex, "gi");
  } catch {
    return [];
  }

  const lines = code.split("\n");
  const findings: Finding[] = [];

  lines.forEach((line, idx) => {
    regex.lastIndex = 0;
    if (regex.test(line)) {
      findings.push({
        ruleId: rule.id,
        filePath,
        lineNumber: idx + 1,
        lineEnd: idx + 1,
        codeSnippet: getSnippet(lines, idx),
        severity: rule.severity,
        category: rule.category,
        title: rule.title,
        description: rule.description,
        aiTools: rule.aiTools,
        fixTemplate: rule.fixTemplate,
      });
    }
  });

  return findings;
}
