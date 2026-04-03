"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const CATEGORIES = [
  { value: "secrets", label: "Secrets" },
  { value: "auth", label: "Auth" },
  { value: "injection", label: "Injection" },
  { value: "cors", label: "CORS" },
  { value: "data-exposure", label: "Data Exposure" },
  { value: "config", label: "Config" },
];
const AI_TOOLS = ["copilot", "cursor", "lovable", "bolt", "claude-code"];

const SEV_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-950 border-red-800 text-red-400",
  HIGH: "bg-orange-950 border-orange-800 text-orange-400",
  MEDIUM: "bg-yellow-950 border-yellow-800 text-yellow-400",
  LOW: "bg-blue-950 border-blue-800 text-blue-400",
};

export default function RulesFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const sev = params.get("severity") ?? "all";
  const cat = params.get("category") ?? "all";
  const tool = params.get("tool") ?? "all";

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "all") next.delete(key);
    else next.set(key, value);
    router.push(`/rules?${next.toString()}`);
  }

  function Chip({
    active,
    onClick,
    children,
    activeClass,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    activeClass?: string;
  }) {
    return (
      <button
        onClick={onClick}
        className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
          active
            ? activeClass ?? "bg-zinc-700 border-zinc-600 text-zinc-100"
            : "bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
        }`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 mb-8">
      {/* Severity */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-zinc-600 mr-1">Severity</span>
        <Chip active={sev === "all"} onClick={() => update("severity", "all")}>All</Chip>
        {SEVERITIES.map((s) => (
          <Chip
            key={s}
            active={sev === s}
            onClick={() => update("severity", s)}
            activeClass={SEV_COLORS[s]}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Chip>
        ))}
      </div>

      {/* Category */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-zinc-600 mr-1">Category</span>
        <Chip active={cat === "all"} onClick={() => update("category", "all")}>All</Chip>
        {CATEGORIES.map(({ value, label }) => (
          <Chip key={value} active={cat === value} onClick={() => update("category", value)}>
            {label}
          </Chip>
        ))}
      </div>

      {/* AI Tool */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-zinc-600 mr-1">AI tool</span>
        <Chip active={tool === "all"} onClick={() => update("tool", "all")}>All</Chip>
        {AI_TOOLS.map((t) => (
          <Chip key={t} active={tool === t} onClick={() => update("tool", t)}>
            {t}
          </Chip>
        ))}
      </div>
    </div>
  );
}
