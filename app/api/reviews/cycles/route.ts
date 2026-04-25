import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveCompanyId } from "@/lib/companyId"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const companyId = await resolveCompanyId(session.user as { companyId?: string })

  const cycles = await prisma.reviewCycle.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { reviews: true } } },
  })

  return NextResponse.json(cycles)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role } = session.user as { role: string }
  if (role !== "SUPER_ADMIN" && role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const companyId = await resolveCompanyId(session.user as { companyId?: string })

  const body = await req.json()
  const { name, type, startDate, deadline } = body

  if (!name || !type || !startDate || !deadline) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const employees = await prisma.employee.findMany({
    where: { companyId, status: "ACTIVE" },
    select: { id: true, managerId: true },
  })

  const cycle = await prisma.reviewCycle.create({
    data: {
      name,
      type,
      startDate: new Date(startDate),
      deadline: new Date(deadline),
      companyId,
    },
  })

  const reviewStubs: {
    cycleId: string
    revieweeId: string
    reviewerId: string
    reviewerRole: string
    answers: string
    companyId: string
  }[] = []

  for (const emp of employees) {
    reviewStubs.push({
      cycleId: cycle.id,
      revieweeId: emp.id,
      reviewerId: emp.id,
      reviewerRole: "SELF",
      answers: "{}",
      companyId,
    })
    if (emp.managerId && type !== "SELF_ONLY") {
      reviewStubs.push({
        cycleId: cycle.id,
        revieweeId: emp.id,
        reviewerId: emp.managerId,
        reviewerRole: "MANAGER",
        answers: "{}",
        companyId,
      })
    }
  }

  if (reviewStubs.length > 0) {
    await prisma.performanceReview.createMany({ data: reviewStubs })
  }

  return NextResponse.json(cycle, { status: 201 })
}
