import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import BillingClient from "./BillingClient";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      orgId: true,
      organization: {
        select: {
          name: true,
          subscriptionTier: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          stripePriceId: true,
          stripeCurrentPeriodEnd: true,
        },
      },
    },
  });

  const org = user?.organization as {
    name: string;
    subscriptionTier: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    stripeCurrentPeriodEnd: Date | null;
  } | null;

  const tier = org?.subscriptionTier ?? "FREE";
  const periodEnd = org?.stripeCurrentPeriodEnd;
  const isActive = periodEnd ? periodEnd.getTime() > Date.now() : false;
  const currentTier = isActive ? tier : "FREE";
  const hasBillingAccount = !!org?.stripeCustomerId;
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader email={session.user.email} isAdmin={isAdmin} nav="billing" />
      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1">Billing &amp; Plan</h1>
        <p className="text-zinc-400 text-sm mb-8">Manage your subscription and payment details.</p>
        <BillingClient
          currentTier={currentTier}
          periodEnd={periodEnd ? periodEnd.toISOString() : null}
          hasBillingAccount={hasBillingAccount}
          orgName={org?.name ?? ""}
        />
      </main>
    </div>
  );
}
