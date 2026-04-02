"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Shield, AlertTriangle, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScanResult, Finding } from "@/lib/engine/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-zinc-900 border border-zinc-700 rounded-lg animate-pulse" />
  ),
});

type Language = "javascript" | "typescript" | "python";

const SEVERITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  CRITICAL: {
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-950",
    border: "border-red-800",
  },
  HIGH: {
    label: "High",
    color: "text-orange-400",
    bg: "bg-orange-950",
    border: "border-orange-800",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-yellow-400",
    bg: "bg-yellow-950",
    border: "border-yellow-800",
  },
  LOW: {
    label: "Low",
    color: "text-blue-400",
    bg: "bg-blue-950",
    border: "border-blue-800",
  },
  INFO: {
    label: "Info",
    color: "text-zinc-400",
    bg: "bg-zinc-800",
    border: "border-zinc-700",
  },
};

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-400 border-green-700 bg-green-950",
  B: "text-blue-400 border-blue-700 bg-blue-950",
  C: "text-yellow-400 border-yellow-700 bg-yellow-950",
  D: "text-orange-400 border-orange-700 bg-orange-950",
  F: "text-red-400 border-red-700 bg-red-950",
};

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEVERITY_CONFIG[severity];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${cfg.color} ${cfg.bg} border ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-zinc-900/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <SeverityBadge severity={finding.severity} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{finding.title}</p>
          <p className="text-zinc-500 text-xs mt-0.5">
            Line {finding.lineNumber} · {finding.category}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 p-4 space-y-4">
          {/* Code snippet */}
          <pre className="bg-zinc-950 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
            {finding.codeSnippet}
          </pre>

          {/* Description */}
          <p className="text-zinc-300 text-sm">{finding.description}</p>

          {/* Fix suggestion */}
          {finding.fixTemplate && (
            <div className="bg-green-950/30 border border-green-900 rounded p-3">
              <p className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Fix
              </p>
              <p className="text-green-300 text-sm">{finding.fixTemplate}</p>
            </div>
          )}

          {/* AI tools */}
          {finding.aiTools && finding.aiTools.length > 0 && (
            <div>
              <p className="text-zinc-500 text-xs mb-1.5">
                Commonly produced by:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {finding.aiTools.map((tool) => (
                  <span
                    key={tool}
                    className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScanResults({ result }: { result: ScanResult & { scanId: string } }) {
  const gradeClass =
    GRADE_COLORS[result.grade] ?? "text-zinc-400 border-zinc-600 bg-zinc-800";
  const severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];

  const findingsBySeverity = severities
    .map((sev) => ({
      sev,
      findings: result.findings.filter((f) => f.severity === sev),
    }))
    .filter(({ findings }) => findings.length > 0);

  return (
    <div className="space-y-6 mt-6">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900">
        {/* Grade */}
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-full border-2 font-bold text-2xl ${gradeClass}`}
        >
          {result.grade}
        </div>
        <div>
          <p className="text-lg font-bold">Risk score: {result.riskScore}/100</p>
          <p className="text-zinc-400 text-sm">
            {result.totalFindings} finding
            {result.totalFindings !== 1 ? "s" : ""} · {result.linesScanned} lines scanned
          </p>
        </div>
        <div className="flex flex-wrap gap-3 ml-auto">
          {[
            { label: "Critical", count: result.criticalCount, color: "text-red-400" },
            { label: "High", count: result.highCount, color: "text-orange-400" },
            { label: "Medium", count: result.mediumCount, color: "text-yellow-400" },
            { label: "Low", count: result.lowCount, color: "text-blue-400" },
          ].map(({ label, count, color }) =>
            count > 0 ? (
              <div key={label} className="text-center">
                <p className={`text-xl font-bold ${color}`}>{count}</p>
                <p className="text-zinc-500 text-xs">{label}</p>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Findings */}
      {result.totalFindings === 0 ? (
        <div className="flex flex-col items-center py-12 text-center border border-dashed border-zinc-800 rounded-xl">
          <Shield className="h-10 w-10 text-green-500 mb-3" />
          <p className="font-semibold text-green-400">No vulnerabilities found</p>
          <p className="text-zinc-500 text-sm mt-1">
            This code passed all {26} detection rules
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {findingsBySeverity.map(({ sev, findings }) => (
            <div key={sev}>
              <div className="flex items-center gap-2 mb-3">
                <SeverityBadge severity={sev} />
                <span className="text-zinc-400 text-sm">
                  {findings.length} finding{findings.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {findings.map((f, i) => (
                  <FindingCard key={`${f.ruleId}-${i}`} finding={f} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PLACEHOLDER: Record<Language, string> = {
  javascript: `// Paste your JavaScript code here
const apiKey = "sk-abc123def456";

export async function GET(request) {
  const { id } = await request.json();
  const result = await db.query(\`SELECT * FROM users WHERE id = \${id}\`);
  return Response.json(result);
}`,
  typescript: `// Paste your TypeScript code here
export async function POST(request: Request) {
  const body = await request.json();
  const user = await prisma.user.findMany();
  return Response.json({ data: user });
}`,
  python: `# Paste your Python code here
import os
SECRET_KEY = "hardcoded-secret-123"

def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return db.execute(query)`,
};

export default function PasteScanner() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language>("typescript");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<(ScanResult & { scanId: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    if (!code.trim()) return;
    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/scan/paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="typescript">TypeScript</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
        </select>
        <Button
          onClick={handleScan}
          disabled={scanning || !code.trim()}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-50"
        >
          {scanning ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-pulse" />
              Scanning…
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Scan
            </>
          )}
        </Button>
      </div>

      {/* Editor */}
      <div className="rounded-lg border border-zinc-700 overflow-hidden">
        <MonacoEditor
          height="360px"
          language={language}
          value={code}
          onChange={(v) => setCode(v ?? "")}
          theme="vs-dark"
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            wordWrap: "on",
            padding: { top: 12, bottom: 12 },
          }}
          onMount={(editor) => {
            if (!code) editor.setValue(PLACEHOLDER[language]);
            setCode(editor.getValue());
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && <ScanResults result={result} />}
    </div>
  );
}
