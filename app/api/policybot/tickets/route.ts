import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { role, companyId, employeeId } = session.user as {
    role?: string
    companyId?: string
    employeeId?: string
  }

  if (!companyId) {
    return NextResponse.json({ error: "No company associated" }, { status: 400 })
  }

  const isAdmin = role === "HR_ADMIN" || role === "SUPER_ADMIN"

  const where = isAdmin
    ? { companyId }
    : { companyId, employeeId: employeeId ?? "" }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      employee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ tickets })
}
