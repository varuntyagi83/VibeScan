// vibescan-disable-file — risk category mapping constants, not application code

/**
 * Risk category taxonomy for security findings.
 *
 * Each category answers a different question for the developer:
 *   financial     — Can this directly cost money? (fraud, chargebacks, SLA breaches)
 *   reputational  — Can this damage trust or go public? (data breach headlines)
 *   user          — Does this put individual user data or accounts at risk?
 *   operational   — Can this take the service down or cause data loss?
 *   security      — Weakens the technical security posture of the system
 *   compliance    — May violate GDPR, SOC 2, PCI-DSS, HIPAA, or similar
 */
export type RiskCategory =
  | "financial"
  | "reputational"
  | "user"
  | "operational"
  | "security"
  | "compliance";

const MAP: Record<string, RiskCategory[]> = {
  // ── Secrets ────────────────────────────────────────────────────────────────
  "hardcoded-api-key":             ["security", "operational", "reputational"],
  "hardcoded-secret":              ["security", "operational", "reputational"],
  "hardcoded-secret-variant":      ["security", "operational", "reputational"],
  "supabase-key-client":           ["security", "operational", "user"],
  "env-in-client":                 ["security", "operational"],
  "dotenv-committed":              ["security", "operational", "compliance"],

  // ── Authentication ─────────────────────────────────────────────────────────
  "missing-auth-api":              ["security", "user", "reputational"],
  "jwt-no-verify":                 ["security", "user"],
  "cors-wildcard":                 ["security", "user"],
  "cors-credentials-wildcard":     ["security", "user"],
  "no-csrf":                       ["security", "user"],
  "missing-rls":                   ["security", "user", "compliance"],
  "default-admin":                 ["security", "operational"],
  "no-rate-limit":                 ["security", "operational", "financial"],

  // ── Injection ──────────────────────────────────────────────────────────────
  "sql-interpolation":             ["security", "user", "operational"],
  "nosql-injection":               ["security", "user"],
  "xss-dangerously":               ["security", "user", "reputational"],
  "eval-usage":                    ["security", "operational"],
  "command-injection":             ["security", "operational"],

  // ── Data Exposure ──────────────────────────────────────────────────────────
  "full-error-client":             ["security", "reputational"],
  "console-log-sensitive":         ["security", "compliance"],
  "unfiltered-query":              ["security", "user", "compliance"],
  "debug-mode-prod":               ["security", "reputational"],
  "missing-security-headers":      ["security"],

  // ── Config ─────────────────────────────────────────────────────────────────
  "no-input-validation":           ["security", "operational"],
  "unvalidated-redirect":          ["security", "reputational", "user"],
  "insecure-cookie":               ["security", "user"],

  // ── Project-graph (existing) ───────────────────────────────────────────────
  "graph-idor":                    ["security", "user", "reputational", "compliance"],
  "graph-server-action-no-auth":   ["security", "user"],
  "graph-middleware-gap":          ["security", "user"],
  "graph-mass-assignment":         ["security", "user"],
  "graph-secret-in-client-import": ["security", "operational"],
  "graph-missing-captcha":         ["security", "operational", "financial"],
  "graph-missing-security-headers":["security"],

  // ── Dependency CVEs (existing) ────────────────────────────────────────────
  "dep-lodash-proto-pollution":     ["security", "operational"],
  "dep-jwt-algorithm-confusion":    ["security", "user", "financial"],
  "dep-axios-csrf":                 ["security", "user"],
  "dep-qs-proto-pollution":         ["security", "operational"],
  "dep-express-open-redirect":      ["security", "reputational", "user"],
  "dep-semver-redos":               ["security", "operational"],
  "dep-ws-dos":                     ["security", "operational"],
  "dep-path-to-regexp-redos":       ["security", "operational"],
  "dep-node-fetch-header-inject":   ["security", "user"],
  "dep-tar-path-traversal":         ["security", "operational"],
  "dep-undici-smuggling":           ["security", "user"],
  "dep-next-ssrf-middleware-bypass":["security", "user", "financial"],
  "dep-vm2-rce":                    ["security", "operational"],
  "dep-serialize-xss":              ["security", "user"],

  // ── New AST rules ──────────────────────────────────────────────────────────
  "insecure-randomness":            ["security", "user"],
  "auth-callbackurl-redirect":      ["security", "reputational", "user"],
  "timing-attack":                  ["security", "user"],
  "ssrf":                           ["security", "operational"],
  "path-traversal":                 ["security", "operational"],
  "nextpublic-secret":              ["security", "operational"],
  "localstorage-auth-token":        ["security", "user"],
  "missing-cache-control":          ["security", "user", "compliance"],
  "email-header-injection":         ["security", "reputational", "operational"],
  "file-upload-no-validation":      ["security", "operational"],
  "redos-regexp":                   ["security", "operational"],
  "queryraw-string-concat":         ["security", "user"],
  "sensitive-in-query-param":       ["security", "user", "compliance"],
  "missing-samesite-cookie":        ["security", "user"],
  "webhook-no-verify":              ["financial", "security", "operational"],

  // ── New project-graph rules ────────────────────────────────────────────────
  "graph-stripe-price-client":      ["financial", "security"],
  "graph-account-enumeration":      ["security", "reputational"],
  "graph-password-reset-lifecycle": ["security", "user"],
  "graph-graphql-introspection":    ["security"],

  // ── New dep rules ──────────────────────────────────────────────────────────
  "dep-dependency-confusion":       ["security", "operational"],

  // ── AI deep scan (default) ─────────────────────────────────────────────────
  "ai-detected":                    ["security"],
};

/**
 * Return the risk categories for a given rule ID.
 * Falls back to ["security"] if the rule is unknown.
 */
export function getRiskCategories(ruleId: string): string[] {
  return MAP[ruleId] ?? ["security"];
}
