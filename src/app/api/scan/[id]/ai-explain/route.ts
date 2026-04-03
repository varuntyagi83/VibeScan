import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enrichFindingsWithAI } from "@/lib/ai-explain";

// Free tier: 3 AI explanations per scan. Pro/Enterprise: unlimited.
const FREE_LIMIT = 3;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: scanId } = await params;

  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      createdBy: { select: { role: true } },
    },
  });

  if (!scan || scan.createdById !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (scan.status !== "COMPLETE") {
    return NextResponse.json({ error: "Scan not complete" }, { status: 400 });
  }

  // Determine limit based on subscription tier (org-level in future; user role for now)
  const isPro = (session.user as { role?: string }).role === "ADMIN"; // placeholder — wire to subscription tier
  const limit = isPro ? Infinity : FREE_LIMIT;

  const enriched = await enrichFindingsWithAI(scanId, limit);

  return NextResponse.json({ enriched, limited: !isPro && enriched >= FREE_LIMIT });
}
