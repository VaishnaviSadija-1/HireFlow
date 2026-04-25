import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { role, companyId } = session.user as { role?: string; companyId?: string }

  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden — HR Admin only" }, { status: 403 })
  }

  const { id } = await params

  // Confirm ticket belongs to this company
  const existing = await prisma.ticket.findFirst({
    where: { id, companyId: companyId ?? "" },
  })

  if (!existing) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: { resolved: true },
    include: {
      employee: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json({ ticket })
}
