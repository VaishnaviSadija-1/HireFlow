import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SynthesizeButton } from "@/components/reviews/SynthesizeButton"
import { ArrowLeft, Star, CheckCircle2, Clock, ChevronRight, Sparkles } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function CyclePage({
  params,
}: {
  params: Promise<{ cycleId: string }>
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
  const { cycleId } = await params

  const cycle = await prisma.reviewCycle.findFirst({
    where: { id: cycleId, companyId },
  })
  if (!cycle) redirect("/reviews")

  const isAdmin = role === "SUPER_ADMIN" || role === "HR_ADMIN"
  const isManager = role === "MANAGER"

  // Load all reviews for this cycle
  const allReviews = await prisma.performanceReview.findMany({
    where: { cycleId, companyId },
  })

  // Load employees for name lookup
  const employeeIds = [...new Set(allReviews.map((r) => r.revieweeId))]
  const employees = await prisma.employee.findMany({
    where: { id: { in: employeeIds }, companyId },
    include: { department: { select: { name: true } } },
  })
  const empMap = new Map(employees.map((e) => [e.id, e]))

  // Group reviews by reviewee
  const byReviewee = new Map<
    string,
    {
      self: (typeof allReviews)[number] | undefined
      manager: (typeof allReviews)[number] | undefined
    }
  >()
  for (const r of allReviews) {
    if (!byReviewee.has(r.revieweeId)) byReviewee.set(r.revieweeId, { self: undefined, manager: undefined })
    const entry = byReviewee.get(r.revieweeId)!
    if (r.reviewerRole === "SELF") entry.self = r
    if (r.reviewerRole === "MANAGER") entry.manager = r
  }

  // For employees: find only their relevant reviews
  const myAsReviewee = allReviews.filter((r) => r.revieweeId === sessionEmpId)
  const myAsReviewer = allReviews.filter((r) => r.reviewerId === sessionEmpId && r.revieweeId !== sessionEmpId)
  const mySelfReview = allReviews.find((r) => r.revieweeId === sessionEmpId && r.reviewerRole === "SELF")
  const myManagerReview = allReviews.find((r) => r.revieweeId === sessionEmpId && r.reviewerRole === "MANAGER")

  const totalSelf = allReviews.filter((r) => r.reviewerRole === "SELF").length
  const submittedSelf = allReviews.filter((r) => r.reviewerRole === "SELF" && r.submittedAt).length
  const totalManager = allReviews.filter((r) => r.reviewerRole === "MANAGER").length
  const submittedManager = allReviews.filter((r) => r.reviewerRole === "MANAGER" && r.submittedAt).length

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 lg:px-8">
        <Link
          href="/reviews"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Review Cycles
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1e40af] flex items-center justify-center shadow-md shadow-blue-500/20">
              <Star className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Sora', sans-serif" }}>
                {cycle.name}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {cycle.type.replace("_", " ").replace("THREE SIXTY", "360°")} ·
                Deadline{" "}
                {new Date(cycle.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={
              cycle.status === "OPEN"
                ? { background: "rgba(16,185,129,0.1)", color: "#10b981" }
                : { background: "rgba(100,116,139,0.1)", color: "#64748b" }
            }
          >
            {cycle.status === "OPEN" ? "Open" : cycle.status === "CLOSED" ? "Closed" : "Results Shared"}
          </span>
        </div>
      </div>

      <div className="px-6 py-6 lg:px-8 max-w-screen-xl mx-auto space-y-5">
        {/* Progress KPIs — admin/manager */}
        {(isAdmin || isManager) && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Self Reviews", value: `${submittedSelf}/${totalSelf}`, sub: "submitted" },
              { label: "Manager Reviews", value: `${submittedManager}/${totalManager}`, sub: "submitted" },
              {
                label: "Overall Completion",
                value:
                  totalSelf + totalManager > 0
                    ? `${Math.round(((submittedSelf + submittedManager) / (totalSelf + totalManager)) * 100)}%`
                    : "0%",
                sub: "reviews done",
              },
              {
                label: "AI Summaries",
                value: allReviews.filter((r) => r.aiSummary).length,
                sub: "generated",
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white rounded-xl border border-slate-100 p-4"
              >
                <p
                  className="text-2xl font-bold text-slate-800 tabular-nums"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {kpi.value}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{kpi.label}</p>
                <p className="text-[10px] text-slate-400">{kpi.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Employee: my review status */}
        {!isAdmin && (
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">My Reviews</h2>
            <div className="space-y-3">
              {mySelfReview && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Self Review</p>
                    <p className="text-xs text-slate-400">Reflect on your own performance this period</p>
                  </div>
                  {mySelfReview.submittedAt ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Submitted
                    </div>
                  ) : (
                    <Link
                      href={`/reviews/${cycleId}/submit/self`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: "#4f6ef7", color: "white" }}
                    >
                      Start review →
                    </Link>
                  )}
                </div>
              )}

              {myManagerReview && isManager && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Manager Reviews</p>
                    <p className="text-xs text-slate-400">Review your direct reports</p>
                  </div>
                  <Link
                    href={`/reviews/${cycleId}/submit/manager`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: "#4f6ef7", color: "white" }}
                  >
                    Review team →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin: all employees list */}
        {isAdmin && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <h2 className="text-sm font-semibold text-slate-800">Employee Reviews</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click an employee to view or generate their AI summary
              </p>
            </div>
            <div className="divide-y divide-slate-50">
              {[...byReviewee.entries()].map(([empId, reviews]) => {
                const emp = empMap.get(empId)
                if (!emp) return null
                const selfDone = !!reviews.self?.submittedAt
                const mgrDone = !!reviews.manager?.submittedAt
                const hasSummary = !!reviews.self?.aiSummary
                const canSynthesize = selfDone || mgrDone

                return (
                  <div key={empId} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "#eff6ff", color: "#1e40af" }}>
                        <span className="text-xs font-bold">
                          {emp.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{emp.name}</p>
                        <p className="text-xs text-slate-400 truncate">{emp.department?.name} · {emp.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-center gap-1.5">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={selfDone ? { background: "#dcfce7", color: "#16a34a" } : { background: "#f1f5f9", color: "#94a3b8" }}
                        >
                          Self {selfDone ? "✓" : "pending"}
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={mgrDone ? { background: "#dcfce7", color: "#16a34a" } : { background: "#f1f5f9", color: "#94a3b8" }}
                        >
                          Manager {mgrDone ? "✓" : "pending"}
                        </span>
                      </div>

                      {hasSummary ? (
                        <Link
                          href={`/reviews/${cycleId}/results/${empId}`}
                          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all"
                          style={{ background: "rgba(79,110,247,0.08)", color: "#4f6ef7" }}
                        >
                          <Sparkles className="w-3 h-3" />
                          View summary
                        </Link>
                      ) : canSynthesize ? (
                        <SynthesizeButton cycleId={cycleId} employeeId={empId} employeeName={emp.name} />
                      ) : (
                        <span className="text-xs text-slate-300">Awaiting submissions</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Manager: their direct reports */}
        {isManager && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <h2 className="text-sm font-semibold text-slate-800">Your Direct Reports</h2>
              <p className="text-xs text-slate-400 mt-0.5">Reviews you need to submit for your team</p>
            </div>
            <div className="divide-y divide-slate-50">
              {allReviews
                .filter((r) => r.reviewerId === sessionEmpId && r.reviewerRole === "MANAGER")
                .map((r) => {
                  const emp = empMap.get(r.revieweeId)
                  if (!emp) return null
                  return (
                    <div key={r.id} className="px-5 py-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{emp.name}</p>
                        <p className="text-xs text-slate-400">{emp.title}</p>
                      </div>
                      {r.submittedAt ? (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Submitted
                        </span>
                      ) : (
                        <Link
                          href={`/reviews/${cycleId}/submit/manager?revieweeId=${r.revieweeId}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "#4f6ef7", color: "white" }}
                        >
                          Review {emp.name.split(" ")[0]} →
                        </Link>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
