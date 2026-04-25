import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { extractPulseKeywords } from "@/lib/ai/surveys"
import { SentimentHeatmap } from "@/components/surveys/SentimentHeatmap"
import { ArrowLeft, BarChart2 } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SurveyResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { role } = session.user as { role: string }
  if (role !== "SUPER_ADMIN" && role !== "HR_ADMIN" && role !== "MANAGER") {
    redirect("/surveys")
  }

  let companyId = (session.user as { companyId?: string }).companyId
  if (!companyId) {
    const first = await prisma.company.findFirst({ select: { id: true } })
    companyId = first?.id ?? ""
  }

  const { id: surveyId } = await params

  const survey = await prisma.pulseSurvey.findFirst({
    where: { id: surveyId, companyId },
  })
  if (!survey) redirect("/surveys")

  const responses = await prisma.pulseSurveyResponse.findMany({
    where: { surveyId, companyId },
    orderBy: { weekOf: "asc" },
  })

  const departments = await prisma.department.findMany({
    where: { companyId },
    select: { id: true, name: true },
  })
  const deptMap = new Map(departments.map((d) => [d.id, d.name]))

  // Aggregate by week × dept
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

  // AI keywords for latest week
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

  const totalResponses = responses.length
  const overallAvg =
    heatmap.length > 0
      ? (
          heatmap.flatMap((w) => w.depts.flatMap((d) => Array(d.responseCount).fill(d.avgRating ?? 0)))
            .reduce((a: number, b: number) => a + b, 0) / Math.max(totalResponses, 1)
        ).toFixed(1)
      : "—"

  return (
    <div className="min-h-screen" style={{ background: "#111118" }}>
      {/* Header */}
      <div className="px-6 py-5 lg:px-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/surveys"
            className="flex items-center gap-1.5 text-xs transition-all hover:opacity-80"
            style={{ color: "#8b8b9e" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to surveys
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center">
            <BarChart2 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
              {survey.title}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#8b8b9e" }}>
              Sentiment heatmap · {totalResponses} total responses
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 lg:px-8 max-w-screen-xl mx-auto space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Responses", value: totalResponses, sub: "anonymous submissions" },
            { label: "Overall Avg Score", value: overallAvg + " / 10", sub: "across all departments" },
            { label: "Weeks of Data", value: weeks.length, sub: "rolling history" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p
                className="text-2xl font-bold text-white tabular-nums"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {kpi.value}
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "#8b8b9e" }}>{kpi.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#55556a" }}>{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div
          className="rounded-xl p-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Department Sentiment Heatmap</h2>
            <p className="text-xs mt-0.5" style={{ color: "#8b8b9e" }}>
              Average rating by department per week. Hover for details and AI-extracted themes.
            </p>
          </div>
          <SentimentHeatmap heatmap={heatmap} departments={departments} />
        </div>

        {/* Latest week themes */}
        {latestWeek && Object.keys(keywordsByDept).length > 0 && (
          <div
            className="rounded-xl p-5"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h2 className="text-sm font-semibold text-white mb-1">AI Pulse Insights</h2>
            <p className="text-xs mb-4" style={{ color: "#8b8b9e" }}>
              Recurring themes from this week's anonymous comments, extracted by Claude.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(keywordsByDept).map(([deptId, keywords]) => (
                <div
                  key={deptId}
                  className="rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-xs font-semibold text-white mb-3">
                    {deptMap.get(deptId) ?? "Unknown"}
                  </p>
                  <div className="space-y-1.5">
                    {keywords.map((kw) => (
                      <div key={kw.theme} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "#c9c9d4" }}>{kw.theme}</span>
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(79,110,247,0.15)", color: "#818cf8" }}
                        >
                          ×{kw.count}
                        </span>
                      </div>
                    ))}
                    {keywords.length === 0 && (
                      <p className="text-xs" style={{ color: "#55556a" }}>No text comments this week</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
