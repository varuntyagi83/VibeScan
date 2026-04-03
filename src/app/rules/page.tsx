import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Suspense } from "react";
import RulesFilters from "./RulesFilters";
import AppHeader from "@/components/AppHeader";

const SEV_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-950 border-red-800 text-red-400",
  HIGH: "bg-orange-950 border-orange-800 text-orange-400",
  MEDIUM: "bg-yellow-950 border-yellow-800 text-yellow-400",
  LOW: "bg-blue-950 border-blue-800 text-blue-400",
  INFO: "bg-zinc-800 border-zinc-700 text-zinc-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  secrets: "Secrets & Credentials",
  auth: "Authentication",
  injection: "Injection",
  cors: "CORS & Headers",
  "data-exposure": "Data Exposure",
  config: "Configuration",
};

const AI_TOOL_LABELS: Record<string, string> = {
  copilot: "Copilot",
  cursor: "Cursor",
  lovable: "Lovable",
  bolt: "Bolt",
  "claude-code": "Claude Code",
};

type SearchParams = Promise<{ severity?: string; category?: string; tool?: string }>;

export default async function RulesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { severity, category, tool } = await searchParams;

  const where = {
    ...(severity ? { severity: severity as never } : {}),
    ...(category ? { category } : {}),
    ...(tool ? { aiTools: { has: tool } } : {}),
  };

  const [rules, totalCount] = await Promise.all([
    prisma.rule.findMany({
      where,
      orderBy: [{ severity: "asc" }, { category: "asc" }],
    }),
    prisma.rule.count(),
  ]);

  // Stats for the header
  const stats = await prisma.rule.groupBy({
    by: ["severity"],
    _count: { id: true },
  });
  const sevCounts = Object.fromEntries(stats.map((s) => [s.severity, s._count.id]));

  const isAdmin = (session.user as { role?: string }).role === "ADMIN";

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader email={session.user.email} isAdmin={isAdmin} nav="rules" />

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>

        {/* Page header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-red-500" />
            <h1 className="text-2xl font-bold">Detection Rules</h1>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          {totalCount} rules detecting vulnerabilities introduced by AI coding tools
        </p>

        {/* Severity overview */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
            <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${SEV_COLORS[s]}`}>
              {sevCounts[s] ?? 0} {s.charAt(0) + s.slice(1).toLowerCase()}
            </div>
          ))}
        </div>

        {/* Filters */}
        <Suspense>
          <RulesFilters />
        </Suspense>

        {/* Results count */}
        {(severity || category || tool) && (
          <p className="text-sm text-muted-foreground mb-4">
            {rules.length} rule{rules.length !== 1 ? "s" : ""} match
            {rules.length !== 1 ? "" : "es"} your filters
          </p>
        )}

        {/* Rules list */}
        {rules.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center border border-dashed border-zinc-800 rounded-xl">
            <BookOpen className="h-8 w-8 text-zinc-700 mb-3" />
            <p className="text-zinc-500">No rules match these filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="border border-border rounded-xl overflow-hidden bg-card">
                {/* Rule header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b border-border">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold ${SEV_COLORS[rule.severity] ?? ""}`}
                  >
                    {rule.severity}
                  </span>
                  <span className="font-semibold text-sm flex-1">{rule.title}</span>
                  <span className="text-xs text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded">
                    {CATEGORY_LABELS[rule.category] ?? rule.category}
                  </span>
                </div>

                {/* Rule body */}
                <div className="px-4 py-3 space-y-3">
                  <p className="text-sm text-foreground leading-relaxed">{rule.description}</p>

                  {/* Fix template */}
                  {rule.fixTemplate && (
                    <div className="bg-muted border border-border rounded-lg px-3 py-2">
                      <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Fix</p>
                      <p className="text-xs text-green-700 dark:text-green-300 font-mono leading-relaxed">{rule.fixTemplate}</p>
                    </div>
                  )}

                  {/* AI tools */}
                  {rule.aiTools.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Produced by:</span>
                      {rule.aiTools.map((t) => (
                        <span
                          key={t}
                          className="text-xs text-foreground bg-muted border border-border px-2 py-0.5 rounded"
                        >
                          {AI_TOOL_LABELS[t] ?? t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
