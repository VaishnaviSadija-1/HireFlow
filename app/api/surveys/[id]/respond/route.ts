import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveCompanyId } from "@/lib/companyId"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const companyId = await resolveCompanyId(session.user as { companyId?: string })
  const { id: surveyId } = await params

  const survey = await prisma.pulseSurvey.findFirst({
    where: { id: surveyId, companyId, active: true },
  })
  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 })

  const body = await req.json()
  const { answers, deptId } = body

  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const response = await prisma.pulseSurveyResponse.create({
    data: {
      surveyId,
      deptId: deptId ?? null,
      companyId,
      answers: JSON.stringify(answers),
      weekOf: monday,
    },
  })

  return NextResponse.json({ ok: true, id: response.id }, { status: 201 })
}
