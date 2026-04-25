import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveCompanyId } from "@/lib/companyId"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role, employeeId } = session.user as { role: string; employeeId: string }
  const companyId = await resolveCompanyId(session.user as { companyId?: string })
  const { cycleId } = await params

  const cycle = await prisma.reviewCycle.findFirst({
    where: { id: cycleId, companyId },
  })
  if (!cycle) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const reviews = await prisma.performanceReview.findMany({
    where: { cycleId, companyId },
  })

  let myReviews = reviews
  if (role === "EMPLOYEE") {
    myReviews = reviews.filter(
      (r) => r.reviewerId === employeeId || r.revieweeId === employeeId
    )
  }

  const totalSelf = reviews.filter((r) => r.reviewerRole === "SELF").length
  const submittedSelf = reviews.filter((r) => r.reviewerRole === "SELF" && r.submittedAt).length
  const totalManager = reviews.filter((r) => r.reviewerRole === "MANAGER").length
  const submittedManager = reviews.filter((r) => r.reviewerRole === "MANAGER" && r.submittedAt).length

  return NextResponse.json({
    cycle,
    progress: { totalSelf, submittedSelf, totalManager, submittedManager },
    myReviews: myReviews.map((r) => ({
      id: r.id,
      revieweeId: r.revieweeId,
      reviewerId: r.reviewerId,
      reviewerRole: r.reviewerRole,
      submittedAt: r.submittedAt,
      overallRating: r.overallRating,
      hasAiSummary: !!r.aiSummary,
    })),
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role } = session.user as { role: string }
  if (role !== "SUPER_ADMIN" && role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { cycleId } = await params
  const { status } = await req.json()

  const cycle = await prisma.reviewCycle.update({
    where: { id: cycleId },
    data: { status },
  })

  return NextResponse.json(cycle)
}
