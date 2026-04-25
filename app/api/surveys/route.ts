import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveCompanyId } from "@/lib/companyId"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const companyId = await resolveCompanyId(session.user as { companyId?: string })

  const surveys = await prisma.pulseSurvey.findMany({
    where: { companyId, active: true },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { responses: true } } },
  })

  return NextResponse.json(surveys)
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
  const { title, questions, cadence, targetType, targetId, endsAt } = body

  if (!title || !questions || !cadence || !targetType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const survey = await prisma.pulseSurvey.create({
    data: {
      title,
      questions: JSON.stringify(questions),
      cadence,
      targetType,
      targetId: targetId ?? null,
      companyId,
      endsAt: endsAt ? new Date(endsAt) : null,
    },
  })

  return NextResponse.json(survey, { status: 201 })
}
