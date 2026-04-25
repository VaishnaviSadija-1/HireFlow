import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CreateCycleSheet } from "@/components/reviews/CreateCycleSheet"
import { Star, Clock, ChevronRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

function statusBadge(status: string) {
  if (status === "OPEN") return { label: "Open", color: "#10b981", bg: "rgba(16,185,129,0.1)" }
  if (status === "CLOSED") return { label: "Closed", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" }
  return { label: "Results Shared", color: "#4f6ef7", bg: "rgba(79,110,247,0.1)" }
}

export default async function ReviewsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { role } = session.user as { role: string }

  // SUPER_ADMIN has no companyId — fall back to first company
  let companyId = (session.user as { companyId?: string }).companyId
  if (!companyId) {
    const first = await prisma.company.findFirst({ select: { id: true } })
    companyId = first?.id ?? ""
  }

  const isAdmin = role === "SUPER_ADMIN" || role === "HR_ADMIN"

  const cycles = await prisma.reviewCycle.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { reviews: true } } },
  })

  // Get submission counts for progress
  const cycleIds = cycles.map((c) => c.id)
  const submitted = await prisma.performanceReview.groupBy({
    by: ["cycleId"],
    where: { cycleId: { in: cycleIds }, submittedAt: { not: null } },
    _count: { id: true },
  })
  const submittedMap = new Map(submitted.map((s) => [s.cycleId, s._count.id]))

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1e40af] flex items-center justify-center shadow-md shadow-blue-500/20">
              <Star className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1
                className="text-lg font-bold text-slate-900"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Performance Reviews
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                360° review cycles · AI-synthesized summaries
              </p>
            </div>
          </div>
          {isAdmin && <CreateCycleSheet />}
        </div>
      </div>

      <div className="px-6 py-6 lg:px-8 max-w-screen-xl mx-auto">
        {cycles.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm font-medium text-slate-700">No review cycles yet</p>
            <p className="text-xs text-slate-400 max-w-xs">
              {isAdmin
                ? "Create a review cycle to start collecting structured performance feedback."
                : "No active review cycles. Check back when HR opens one."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cycles.map((cycle) => {
              const badge = statusBadge(cycle.status)
              const totalReviews = cycle._count.reviews
              const submittedCount = submittedMap.get(cycle.id) ?? 0
              const pct = totalReviews > 0 ? Math.round((submittedCount / totalReviews) * 100) : 0

              return (
                <Link
                  key={cycle.id}
                  href={`/reviews/${cycle.id}`}
                  className="block bg-white rounded-xl border border-slate-100 px-5 py-4 hover:shadow-sm hover:shadow-slate-100 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            {badge.label}
                          </span>
                          <span className="text-xs text-slate-400 capitalize">
                            {cycle.type.replace("_", " ").replace("THREE SIXTY", "360°")}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 truncate">{cycle.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            Deadline{" "}
                            {new Date(cycle.deadline).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {submittedCount} / {totalReviews} submitted
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Progress bar */}
                      <div className="hidden sm:block w-24">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400">Progress</span>
                          <span className="text-[10px] font-medium text-slate-600">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#4f6ef7" }}
                          />
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
