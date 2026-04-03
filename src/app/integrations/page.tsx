import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitBranch } from "lucide-react";
import ConnectRepoForm from "./ConnectRepoForm";
import AppHeader from "@/components/AppHeader";

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const repos = await prisma.connectedRepo.findMany({
    where: { userId: session.user.id! },
    orderBy: { createdAt: "desc" },
  });

  const appUrl = process.env.NEXTAUTH_URL ?? "https://vibescan.app";

  const isAdmin = (session.user as { role?: string }).role === "ADMIN";

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader email={session.user.email} isAdmin={isAdmin} nav="integrations" />

      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <GitBranch className="h-5 w-5 text-red-500" />
          <h1 className="text-2xl font-bold">PR Integrations</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Connect GitHub repositories to automatically scan pull requests. VibeScan will post a
          review comment and block the merge if CRITICAL or HIGH vulnerabilities are introduced.
        </p>

        <ConnectRepoForm
          initialRepos={repos.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
          }))}
          webhookBaseUrl={appUrl}
        />
      </main>
    </div>
  );
}
