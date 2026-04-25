import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveCompanyId } from "@/lib/companyId"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { employeeId } = session.user as { employeeId: string }
  const companyId = await resolveCompanyId(session.user as { companyId?: string })
  const { cycleId } = await params

  const body = await req.json()
  const { revieweeId, reviewerRole, answers, overallRating } = body

  if (!revieweeId || !reviewerRole || !answers) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const existing = await prisma.performanceReview.findFirst({
    where: { cycleId, revieweeId, reviewerId: employeeId, reviewerRole, companyId },
  })

  if (!existing) {
    return NextResponse.json({ error: "Review not found for this user" }, { status: 404 })
  }

  if (existing.submittedAt) {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 })
  }

  const updated = await prisma.performanceReview.update({
    where: { id: existing.id },
    data: {
      answers: JSON.stringify(answers),
      overallRating: overallRating ?? null,
      submittedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true, id: updated.id })
}
