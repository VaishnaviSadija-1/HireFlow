import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ArrowLeft, Star, Sparkles, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ReviewResultsPage({
  params,
}: {
  params: Promise<{ cycleId: string; employeeId: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { role, employeeId: sessionEmpId } = session.user as {
    role: string
    employeeId: string
  }
  let companyId = (session.user as { companyId?: string }).companyId
  if (!companyId) {
    const first = await prisma.company.findFirst({ select: { id: true } })
    companyId = first?.id ?? ""
  }

  const { cycleId, employeeId } = await params

  const isOwnRecord = sessionEmpId === employeeId
  const isPrivileged = role === "SUPER_ADMIN" || role === "HR_ADMIN" || role === "MANAGER"
  if (!isOwnRecord && !isPrivileged) redirect("/reviews")

  const cycle = await prisma.reviewCycle.findFirst({ where: { id: cycleId, companyId } })
  if (!cycle) redirect("/reviews")

  const reviewee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { department: { select: { name: true } } },
  })
  if (!reviewee) redirect(`/reviews/${cycleId}`)

  const reviews = await prisma.performanceReview.findMany({
    where: { cycleId, revieweeId: employeeId, companyId },
  })

  const selfReview = reviews.find((r) => r.reviewerRole === "SELF")
  const managerReview = reviews.find((r) => r.reviewerRole === "MANAGER")
  const aiSummary: { strengths: string; growthAreas: string; narrative: string } | null =
    selfReview?.aiSummary ? JSON.parse(selfReview.aiSummary) : null

  const selfAnswers = selfReview?.answers ? JSON.parse(selfReview.answers) as Record<string, string | number> : null
  const managerAnswers = managerReview?.answers ? JSON.parse(managerReview.answers) as Record<string, string | number> : null

  function RatingDots({ value }: { value: number }) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
            style={
              n <= value
                ? { background: "#4f6ef7", color: "white" }
                : { background: "#f1f5f9", color: "#94a3b8" }
            }
          >
            {n}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 lg:px-8">
        <Link
          href={`/reviews/${cycleId}`}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {cycle.name}
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: "#eff6ff", color: "#1e40af" }}
          >
            {reviewee.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Sora', sans-serif" }}>
              {reviewee.name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {reviewee.title} · {reviewee.department?.name} · {cycle.name}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 lg:px-8 max-w-4xl mx-auto space-y-5">
        {/* AI Summary */}
        {aiSummary ? (
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle at 80% 20%, #818cf8 0%, transparent 50%)",
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.3)" }}>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                </div>
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                  AI-Synthesized Performance Summary
                </p>
              </div>

              <p className="text-sm text-indigo-100 leading-relaxed mb-5">{aiSummary.narrative}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-4"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <p className="text-xs font-semibold text-emerald-400">Strengths</p>
                  </div>
                  <p className="text-xs text-emerald-100 leading-relaxed">{aiSummary.strengths}</p>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <p className="text-xs font-semibold text-amber-400">Growth Areas</p>
                  </div>
                  <p className="text-xs text-amber-100 leading-relaxed">{aiSummary.growthAreas}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl p-5 flex items-center gap-3"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
          >
            <Sparkles className="w-5 h-5 text-slate-300" />
            <p className="text-sm text-slate-500">
              AI summary not yet generated.{" "}
              {isPrivileged ? "Go back and click \"Generate AI Summary\" to create one." : "HR will share the summary once ready."}
            </p>
          </div>
        )}

        {/* Ratings row */}
        <div className="grid grid-cols-2 gap-4">
          {selfAnswers?.overallRating && (
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Self Rating</p>
              <RatingDots value={Number(selfAnswers.overallRating)} />
              <p className="text-xs text-slate-400 mt-2">
                {["", "Poor", "Below Average", "Meets Expectations", "Exceeds Expectations", "Outstanding"][
                  Number(selfAnswers.overallRating)
                ]}
              </p>
            </div>
          )}
          {managerAnswers?.overallRating && (
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Manager Rating</p>
              <RatingDots value={Number(managerAnswers.overallRating)} />
              <p className="text-xs text-slate-400 mt-2">
                {["", "Poor", "Below Average", "Meets Expectations", "Exceeds Expectations", "Outstanding"][
                  Number(managerAnswers.overallRating)
                ]}
              </p>
            </div>
          )}
        </div>

        {/* Self review answers */}
        {selfAnswers && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-slate-800">Self Review</h2>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                { key: "accomplishments", label: "Biggest accomplishments" },
                { key: "shortfalls", label: "Goals fell short on" },
                { key: "development", label: "Skills to develop" },
                { key: "managerSupport", label: "Support needed from manager" },
              ]
                .filter(({ key }) => selfAnswers[key])
                .map(({ key, label }) => (
                  <div key={key} className="px-5 py-4">
                    <p className="text-xs font-medium text-slate-400 mb-1.5">{label}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{selfAnswers[key] as string}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Manager review answers — only shown to HR/Manager or if results shared */}
        {managerAnswers && isPrivileged && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-semibold text-slate-800">Manager Review</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 font-medium">
                  HR/Manager only
                </span>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                { key: "strengths", label: "Standout strengths" },
                { key: "growthAreas", label: "Growth areas" },
              ]
                .filter(({ key }) => managerAnswers[key])
                .map(({ key, label }) => (
                  <div key={key} className="px-5 py-4">
                    <p className="text-xs font-medium text-slate-400 mb-1.5">{label}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{managerAnswers[key] as string}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
