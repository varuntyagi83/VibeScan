import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const VALID_ROLES = ["ADMIN", "MEMBER", "VIEWER"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  if (!session?.user || !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json() as { role?: string };

  if (!body.role || !VALID_ROLES.includes(body.role as typeof VALID_ROLES[number])) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role: body.role as typeof VALID_ROLES[number] },
    select: { id: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}
