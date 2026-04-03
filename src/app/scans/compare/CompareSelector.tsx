"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanOption {
  id: string;
  name: string;
  date: string;
  grade: string | null;
}

export default function CompareSelector({
  scans,
  selectedA,
  selectedB,
}: {
  scans: ScanOption[];
  selectedA: string | null;
  selectedB: string | null;
}) {
  const router = useRouter();
  const [a, setA] = useState(selectedA ?? "");
  const [b, setB] = useState(selectedB ?? "");

  useEffect(() => { setA(selectedA ?? ""); }, [selectedA]);
  useEffect(() => { setB(selectedB ?? ""); }, [selectedB]);

  function handleCompare() {
    if (!a || !b || a === b) return;
    router.push(`/scans/compare?a=${a}&b=${b}`);
  }

  const selectClass =
    "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500";

  if (scans.length < 2) {
    return (
      <p className="text-zinc-500 text-sm">
        You need at least 2 completed scans to compare. Run another scan and come back.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
      <div className="flex-1 min-w-[200px] space-y-1.5">
        <label className="text-xs text-zinc-400 font-medium">Baseline (A)</label>
        <select value={a} onChange={(e) => setA(e.target.value)} className={selectClass}>
          <option value="">Select a scan…</option>
          {scans.map((s) => (
            <option key={s.id} value={s.id} disabled={s.id === b}>
              {s.name} — {new Date(s.date).toLocaleDateString()} {s.grade ? `(${s.grade})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[200px] space-y-1.5">
        <label className="text-xs text-zinc-400 font-medium">New scan (B)</label>
        <select value={b} onChange={(e) => setB(e.target.value)} className={selectClass}>
          <option value="">Select a scan…</option>
          {scans.map((s) => (
            <option key={s.id} value={s.id} disabled={s.id === a}>
              {s.name} — {new Date(s.date).toLocaleDateString()} {s.grade ? `(${s.grade})` : ""}
            </option>
          ))}
        </select>
      </div>

      <Button
        onClick={handleCompare}
        disabled={!a || !b || a === b}
        className="shrink-0"
      >
        <GitCompareArrows className="h-3.5 w-3.5 mr-1.5" />
        Compare
      </Button>
    </div>
  );
}
