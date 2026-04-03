"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const SOURCES = ["all", "paste", "upload", "github"] as const;
const GRADES = ["all", "A", "B", "C", "D", "F"] as const;
const SORTS = [
  { value: "date", label: "Newest" },
  { value: "grade", label: "Grade" },
  { value: "findings", label: "Findings" },
  { value: "score", label: "Risk score" },
] as const;

export default function ScanFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const source = params.get("source") ?? "all";
  const grade = params.get("grade") ?? "all";
  const sort = params.get("sort") ?? "date";

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "all" || value === "date") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  const chip = (active: boolean) =>
    `px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
      active
        ? "bg-zinc-700 text-zinc-100"
        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-4 mb-5">
      {/* Source filter */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-zinc-600 mr-1">Source</span>
        {SOURCES.map((s) => (
          <button key={s} onClick={() => update("source", s)} className={chip(source === s)}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-zinc-800" />

      {/* Grade filter */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-zinc-600 mr-1">Grade</span>
        {GRADES.map((g) => (
          <button key={g} onClick={() => update("grade", g)} className={chip(grade === g)}>
            {g === "all" ? "All" : g}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-zinc-800" />

      {/* Sort */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-zinc-600 mr-1">Sort</span>
        {SORTS.map((s) => (
          <button key={s.value} onClick={() => update("sort", s.value)} className={chip(sort === s.value)}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
