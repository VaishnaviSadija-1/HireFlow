import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveCompanyId } from "@/lib/companyId"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cycleId: string; employeeId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role, employeeId: sessionEmployeeId } = session.user as {
    role: string
    employeeId: string
  }
  const companyId = await resolveCompanyId(session.user as { companyId?: string })
  const { cycleId, employeeId } = await params

  const isOwnRecord = sessionEmployeeId === employeeId
  const isPrivileged = role === "SUPER_ADMIN" || role === "HR_ADMIN" || role === "MANAGER"
  if (!isOwnRecord && !isPrivileged) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const cycle = await prisma.reviewCycle.findFirst({
    where: { id: cycleId, companyId },
  })
  if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 })

  const reviews = await prisma.performanceReview.findMany({
    where: { cycleId, revieweeId: employeeId, companyId },
  })

  const selfReview = reviews.find((r) => r.reviewerRole === "SELF")
  const managerReview = reviews.find((r) => r.reviewerRole === "MANAGER")

  const aiSummary = selfReview?.aiSummary
    ? (JSON.parse(selfReview.aiSummary) as {
        strengths: string
        growthAreas: string
        narrative: string
      })
    : null

  return NextResponse.json({
    cycle,
    selfReview: selfReview
      ? { answers: JSON.parse(selfReview.answers), submittedAt: selfReview.submittedAt }
      : null,
    managerReview: managerReview
      ? {
          answers: JSON.parse(managerReview.answers),
          overallRating: managerReview.overallRating,
          submittedAt: managerReview.submittedAt,
        }
      : null,
    aiSummary,
    resultsShared: cycle.status === "RESULTS_SHARED",
  })
}
