import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveCompanyId } from "@/lib/companyId"
import { NextResponse } from "next/server"
import { synthesizeReviews } from "@/lib/ai/reviews"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role } = session.user as { role: string }
  if (role !== "SUPER_ADMIN" && role !== "HR_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const companyId = await resolveCompanyId(session.user as { companyId?: string })
  const { cycleId } = await params
  const { employeeId } = await req.json()

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
    select: { id: true, name: true, title: true },
  })
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 })

  const reviews = await prisma.performanceReview.findMany({
    where: { cycleId, revieweeId: employeeId, companyId, submittedAt: { not: null } },
  })

  if (reviews.length === 0) {
    return NextResponse.json({ error: "No submitted reviews found" }, { status: 400 })
  }

  const reviewInputs = reviews.map((r) => ({
    role: r.reviewerRole as "SELF" | "MANAGER",
    answers: JSON.parse(r.answers) as Record<string, string>,
    overallRating: r.overallRating ?? undefined,
  }))

  const synthesis = await synthesizeReviews(
    employee.name,
    employee.title,
    reviewInputs,
    companyId
  )

  const selfReview = reviews.find((r) => r.reviewerRole === "SELF")
  if (selfReview) {
    await prisma.performanceReview.update({
      where: { id: selfReview.id },
      data: { aiSummary: JSON.stringify(synthesis) },
    })
  }

  return NextResponse.json({ ok: true, synthesis })
}
