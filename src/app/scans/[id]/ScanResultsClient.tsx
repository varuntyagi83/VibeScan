"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Sparkles, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Finding {
  id: string;
  filePath: string;
  lineNumber: number | null;
  codeSnippet: string | null;
  ruleId: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  fixSuggestion: string | null;
  aiExplanation: string | null;
  falsePositive: boolean;
  fixed: boolean;
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: "text-red-400", bg: "bg-red-950", border: "border-red-800" },
  HIGH:     { color: "text-orange-400", bg: "bg-orange-950", border: "border-orange-800" },
  MEDIUM:   { color: "text-yellow-400", bg: "bg-yellow-950", border: "border-yellow-800" },
  LOW:      { color: "text-blue-400", bg: "bg-blue-950", border: "border-blue-800" },
  INFO:     { color: "text-zinc-400", bg: "bg-zinc-800", border: "border-zinc-700" },
};

const SEV_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEVERITY_CONFIG[severity];
  if (!cfg) return null;
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
      {severity.charAt(0) + severity.slice(1).toLowerCase()}
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
            {finding.filePath === "paste" ? "paste" : finding.filePath.split("/").pop()} ·{" "}
            Line {finding.lineNumber ?? "?"} · {finding.category}
          </p>
        </div>
        {finding.aiExplanation && (
          <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" aria-label="AI-analysed" />
        )}
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 p-4 space-y-4">
          {finding.filePath !== "paste" && (
            <p className="text-zinc-500 text-xs font-mono">{finding.filePath}</p>
          )}

          {finding.codeSnippet && (
            <pre className="bg-zinc-950 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
              {finding.codeSnippet}
            </pre>
          )}

          {/* AI explanation (rich) or fallback description */}
          {finding.aiExplanation ? (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                AI Analysis
              </div>
              <div className="text-zinc-300 text-sm whitespace-pre-line">
                {finding.aiExplanation}
              </div>
            </div>
          ) : (
            <p className="text-zinc-300 text-sm">{finding.description}</p>
          )}

          {/* Fix suggestion */}
          {finding.fixSuggestion && (
            <div className="bg-green-950/30 border border-green-900 rounded p-3">
              <p className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-2">
                {finding.aiExplanation ? "AI-generated fix" : "Fix suggestion"}
              </p>
              <pre className="text-green-300 text-xs font-mono whitespace-pre-wrap">
                {finding.fixSuggestion}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ScanResultsClient({
  findings: initialFindings,
  scanId,
  hasUnexplained,
}: {
  findings: Finding[];
  scanId: string;
  hasUnexplained: boolean;
}) {
  const [findings, setFindings] = useState(initialFindings);
  const [analysing, startAnalysis] = useTransition();
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);

  async function handleAIAnalysis() {
    setAnalysisStatus(null);
    startAnalysis(async () => {
      const res = await fetch(`/api/scan/${scanId}/ai-explain`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setAnalysisStatus(data.error ?? "Analysis failed");
        return;
      }

      // Reload findings with new AI data
      const updated = await fetch(`/api/scan/${scanId}/findings`);
      if (updated.ok) {
        const { findings: fresh } = await updated.json();
        setFindings(fresh);
      }

      setAnalysisStatus(
        data.limited
          ? `Analysed 3 findings (free tier limit). Upgrade to Pro to analyse all.`
          : `Analysed ${data.enriched} finding${data.enriched !== 1 ? "s" : ""} with AI.`
      );
    });
  }

  const grouped = SEV_ORDER.map((sev) => ({
    sev,
    items: findings.filter((f) => f.severity === sev),
  })).filter(({ items }) => items.length > 0);

  const criticalOrHigh = findings.filter(
    (f) => f.severity === "CRITICAL" || f.severity === "HIGH"
  );

  return (
    <div className="space-y-6">
      {/* AI analysis banner */}
      {criticalOrHigh.length > 0 && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-purple-900 bg-purple-950/20">
          <div>
            <p className="text-sm font-medium text-purple-300">
              AI-powered deep analysis
            </p>
            <p className="text-xs text-purple-500 mt-0.5">
              {hasUnexplained
                ? `Get plain-English explanations, attack vectors, and AI-generated fixes for your ${criticalOrHigh.length} critical/high findings`
                : "All critical/high findings have been analysed"}
            </p>
          </div>
          {hasUnexplained ? (
            <Button
              onClick={handleAIAnalysis}
              disabled={analysing}
              className="bg-purple-700 hover:bg-purple-600 shrink-0 text-sm"
            >
              {analysing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Analyse with AI
                </>
              )}
            </Button>
          ) : (
            <span className="flex items-center gap-1.5 text-purple-400 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Complete
            </span>
          )}
        </div>
      )}

      {/* Status message */}
      {analysisStatus && (
        <p className="text-sm text-zinc-400 flex items-center gap-1.5">
          {analysisStatus.includes("limit") && <Lock className="h-3.5 w-3.5 text-yellow-400" />}
          {analysisStatus}
        </p>
      )}

      {/* Findings grouped by severity */}
      {grouped.map(({ sev, items }) => (
        <div key={sev}>
          <div className="flex items-center gap-2 mb-3">
            <SeverityBadge severity={sev} />
            <span className="text-zinc-400 text-sm">
              {items.length} finding{items.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2">
            {items.map((f) => (
              <FindingCard key={f.id} finding={f} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
