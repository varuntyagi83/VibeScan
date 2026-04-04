"use client";

import { useState } from "react";
import { Check, Loader2, CreditCard, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  currentTier: string;
  periodEnd: string | null;
  hasBillingAccount: boolean;
  orgName: string;
}

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "€0",
    period: "/month",
    description: "For trying VibeScan",
    features: [
      "10 scans / month",
      "500 files per scan",
      "41 detection rules",
      "PDF export",
      "3 AI explanations / month",
    ],
  },
  {
    key: "pro_monthly",
    name: "Pro",
    price: "€29",
    period: "/month",
    description: "For serious vibe coders",
    features: [
      "Unlimited scans",
      "500 files per scan",
      "41 detection rules",
      "AI Deep Scan",
      "Unlimited AI explanations",
      "PR webhook integration",
      "Priority support",
    ],
    highlight: true,
  },
  {
    key: "pro_annual",
    name: "Pro (annual)",
    price: "€279",
    period: "/year",
    description: "Save €69 vs monthly",
    features: [
      "Everything in Pro monthly",
      "Save 20% (€69/year)",
      "Annual invoice",
    ],
  },
];

export default function BillingClient({ currentTier, periodEnd, hasBillingAccount, orgName }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPro = currentTier === "PRO";
  const periodEndDate = periodEnd ? new Date(periodEnd) : null;

  async function handleUpgrade(plan: string) {
    setError(null);
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setError(null);
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">

      {/* Current plan status */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Current plan</p>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-xl font-bold">{isPro ? "Pro" : "Free"}</span>
              {isPro && (
                <span className="px-2 py-0.5 rounded-full bg-green-950 border border-green-800 text-green-400 text-xs font-medium">
                  Active
                </span>
              )}
            </div>
            {orgName && (
              <p className="text-zinc-500 text-sm mt-1">{orgName}</p>
            )}
            {isPro && periodEndDate && (
              <p className="text-zinc-500 text-xs mt-2">
                Renews {periodEndDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>

          {hasBillingAccount && (
            <Button
              variant="outline"
              className="shrink-0 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-sm"
              onClick={handlePortal}
              disabled={loading === "portal"}
            >
              {loading === "portal" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Manage billing
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Plan cards */}
      {!isPro && (
        <div>
          <p className="text-sm font-medium text-zinc-400 mb-4">Upgrade your plan</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.key === "free" ? !isPro : false;
              const isHighlight = plan.highlight;

              return (
                <div
                  key={plan.key}
                  className={[
                    "relative flex flex-col rounded-xl border p-5 transition-shadow",
                    isHighlight
                      ? "border-primary shadow-[0_0_0_1px_theme(colors.primary.DEFAULT),0_0_20px_theme(colors.red.950)]"
                      : "border-zinc-800 bg-zinc-900",
                  ].join(" ")}
                >
                  {isHighlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-white text-xs font-semibold">
                        <Zap className="h-3 w-3" /> Recommended
                      </span>
                    </div>
                  )}

                  <p className="text-sm font-semibold mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-zinc-500 text-sm mb-1">{plan.period}</span>
                  </div>
                  <p className="text-zinc-500 text-xs mb-4">{plan.description}</p>

                  <ul className="space-y-2 mb-5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="text-center text-sm text-zinc-500 py-2">Current plan</div>
                  ) : plan.key === "free" ? null : (
                    <Button
                      className={isHighlight ? "bg-primary hover:bg-primary/80" : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"}
                      onClick={() => handleUpgrade(plan.key)}
                      disabled={loading !== null}
                    >
                      {loading === plan.key ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manage existing Pro */}
      {isPro && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-3">
          <p className="text-sm font-medium">Manage your Pro subscription</p>
          <p className="text-zinc-500 text-sm">
            Update payment method, download invoices, or cancel your subscription via the billing portal.
          </p>
          <Button
            variant="outline"
            className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={handlePortal}
            disabled={loading === "portal"}
          >
            {loading === "portal" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Open billing portal
          </Button>
        </div>
      )}

      {/* Feature comparison */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-4 py-3 text-zinc-400 font-medium">Feature</th>
              <th className="text-center px-4 py-3 text-zinc-400 font-medium">Free</th>
              <th className="text-center px-4 py-3 text-primary font-medium">Pro</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Scans per month",        "10",          "Unlimited"],
              ["Files per scan",         "500",         "500"],
              ["Detection rules",        "41",          "41"],
              ["Project graph analysis", "✓",           "✓"],
              ["Dependency CVE scan",    "✓",           "✓"],
              ["PDF export",             "✓",           "✓"],
              ["AI explanations",        "3/month",     "Unlimited"],
              ["AI Deep Scan",           "—",           "✓"],
              ["PR webhook integration", "—",           "✓"],
              ["Priority support",       "—",           "✓"],
            ].map(([feature, free, pro]) => (
              <tr key={feature} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                <td className="px-4 py-3 text-zinc-300">{feature}</td>
                <td className="px-4 py-3 text-center text-zinc-500">{free}</td>
                <td className="px-4 py-3 text-center text-primary font-medium">{pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
