import Link from "next/link";
import { Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface AppHeaderProps {
  email?: string | null;
  isAdmin?: boolean;
  nav?: "dashboard" | "scans" | "rules" | "integrations" | "admin";
}

export default function AppHeader({ email, isAdmin, nav }: AppHeaderProps) {
  const linkBase =
    "text-sm transition-colors";
  const activeLink = `${linkBase} text-foreground font-medium`;
  const inactiveLink = `${linkBase} text-muted-foreground hover:text-foreground`;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-foreground">
            Vibe<span className="text-primary">Scan</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/dashboard" className={`px-3 py-1.5 rounded-lg ${nav === "dashboard" ? "bg-muted text-foreground font-medium" : inactiveLink} text-sm`}>
            Dashboard
          </Link>
          <Link href="/scans" className={`px-3 py-1.5 rounded-lg ${nav === "scans" ? "bg-muted text-foreground font-medium" : inactiveLink} text-sm`}>
            Scans
          </Link>
          <Link href="/rules" className={`px-3 py-1.5 rounded-lg ${nav === "rules" ? "bg-muted text-foreground font-medium" : inactiveLink} text-sm`}>
            Rules
          </Link>
          <Link href="/integrations" className={`px-3 py-1.5 rounded-lg ${nav === "integrations" ? "bg-muted text-foreground font-medium" : inactiveLink} text-sm`}>
            Integrations
          </Link>
          {isAdmin && (
            <Link href="/admin" className={`px-3 py-1.5 rounded-lg ${nav === "admin" ? "bg-muted text-foreground font-medium" : inactiveLink} text-sm`}>
              Admin
            </Link>
          )}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          {email && (
            <>
              <span className="hidden sm:block text-xs text-muted-foreground border-l border-border pl-2 max-w-[160px] truncate">
                {email}
              </span>
              <Link
                href="/api/auth/signout"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
              >
                Sign out
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
