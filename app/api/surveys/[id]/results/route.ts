import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveCompanyId } from "@/lib/companyId"
import { NextResponse } from "next/server"
import { extractPulseKeywords } from "@/lib/ai/surveys"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role } = session.user as { role: string }
  if (role !== "SUPER_ADMIN" && role !== "HR_ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const companyId = await resolveCompanyId(session.user as { companyId?: string })
  const { id: surveyId } = await params

  const survey = await prisma.pulseSurvey.findFirst({
    where: { id: surveyId, companyId },
  })
  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const responses = await prisma.pulseSurveyResponse.findMany({
    where: { surveyId, companyId },
    orderBy: { weekOf: "asc" },
  })

  const departments = await prisma.department.findMany({
    where: { companyId },
    select: { id: true, name: true },
  })
  const deptMap = new Map(departments.map((d) => [d.id, d.name]))

  const weekDeptData: Record<
    string,
    Record<string, { ratings: number[]; comments: string[] }>
  > = {}

  for (const r of responses) {
    const weekKey = r.weekOf.toISOString().split("T")[0]
    const deptKey = r.deptId ?? "unknown"
    if (!weekDeptData[weekKey]) weekDeptData[weekKey] = {}
    if (!weekDeptData[weekKey][deptKey]) {
      weekDeptData[weekKey][deptKey] = { ratings: [], comments: [] }
    }
    const answers = JSON.parse(r.answers) as Array<{
      questionIndex: number
      rating?: number
      comment?: string
    }>
    for (const a of answers) {
      if (a.rating != null) weekDeptData[weekKey][deptKey].ratings.push(a.rating)
      if (a.comment?.trim()) weekDeptData[weekKey][deptKey].comments.push(a.comment.trim())
    }
  }

  const weeks = Object.keys(weekDeptData).sort()
  const latestWeek = weeks[weeks.length - 1]
  const keywordsByDept: Record<string, { theme: string; count: number }[]> = {}

  if (latestWeek) {
    for (const [deptId, data] of Object.entries(weekDeptData[latestWeek])) {
      if (data.comments.length > 0) {
        keywordsByDept[deptId] = await extractPulseKeywords(data.comments, companyId)
      }
    }
  }

  const heatmap = weeks.map((week) => ({
    week,
    depts: Object.entries(weekDeptData[week]).map(([deptId, data]) => ({
      deptId,
      deptName: deptMap.get(deptId) ?? "Unknown",
      avgRating:
        data.ratings.length > 0
          ? Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 10) / 10
          : null,
      responseCount: data.ratings.length,
      keywords: keywordsByDept[deptId] ?? [],
    })),
  }))

  return NextResponse.json({ survey, heatmap, departments })
}
