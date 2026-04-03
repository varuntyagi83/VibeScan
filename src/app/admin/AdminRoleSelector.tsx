"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

const ROLES = ["MEMBER", "VIEWER", "ADMIN"] as const;
type Role = typeof ROLES[number];

export default function AdminRoleSelector({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: Role;
}) {
  const [role, setRole] = useState<Role>(currentRole);
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Role;
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      if (res.ok) setRole(next);
    });
  }

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {pending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      <select
        value={role}
        onChange={handleChange}
        disabled={pending}
        className="text-xs rounded-lg border border-border bg-muted px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>
  );
}
