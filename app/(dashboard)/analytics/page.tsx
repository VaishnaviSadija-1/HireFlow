import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { HiringFunnelChart } from "@/components/analytics/HiringFunnelChart"
import { DepartmentBreakdown } from "@/components/analytics/DepartmentBreakdown"
import { FlightRiskTable } from "@/components/analytics/FlightRiskTable"
import { LeaveOverview } from "@/components/analytics/LeaveOverview"
import { GenderBreakdown } from "@/components/analytics/GenderBreakdown"
import {
  Users,
  Briefcase,
  Clock,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  BarChart2,
} from "lucide-react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  kpis: {
    totalEmployees: number
    activeEmployees: number
    openJobs: number
    avgTenureMonths: number
  }
  hiringFunnel: { stage: string; count: number }[]
  departmentStats: { name: string; headcount: number; recentHires: number }[]
  flightRiskEmployees: {
    id: string
    name: string
    department: string
    score: number
    label: "HIGH" | "MEDIUM" | "LOW"
    reasons: string[]
  }[]
  leaveStats: { type: string; totalDays: number; usedDays: number }[]
  genderBreakdown: { gender: string; count: number }[]
  aiNarrative: string
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function getAnalytics(baseUrl: string): Promise<AnalyticsData | null> {
  try {
    const res = await fetch(`${baseUrl}/api/analytics/overview`, {
      cache: "no-store",
      headers: { Cookie: "" }, // auth handled server-side via auth()
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: "blue" | "purple" | "amber" | "slate"
}) {
  const accentMap = {
    blue: {
      icon: "bg-blue-100 text-blue-600",
      value: "text-blue-700",
    },
    purple: {
      icon: "bg-violet-100 text-violet-600",
      value: "text-violet-700",
    },
    amber: {
      icon: "bg-amber-100 text-amber-600",
      value: "text-amber-700",
    },
    slate: {
      icon: "bg-slate-100 text-slate-600",
      value: "text-slate-700",
    },
  }

  const colors = accentMap[accent ?? "slate"]

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-sm hover:shadow-slate-100 transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors.icon}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <p
        className={`text-2xl font-bold tabular-nums ${colors.value}`}
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {value}
      </p>
      <p className="text-sm text-slate-500 mt-0.5 font-medium">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({
  title,
  sub,
  children,
  className,
}: {
  title: string
  sub?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as { role?: string }).role
  if (role !== "SUPER_ADMIN" && role !== "HR_ADMIN" && role !== "MANAGER") {
    redirect("/")
  }

  // Server-side fetch using internal URL
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000"

  // Directly import and call the data-fetching logic instead of HTTP round-trip
  const { prisma } = await import("@/lib/prisma")
  const { generateRiskNarrative } = await import("@/lib/ai/analytics")
  const { resolveCompanyId } = await import("@/lib/companyId")

  const companyId = await resolveCompanyId(session.user as { companyId?: string })
  const now = new Date()

  function monthsDiff(from: Date, to: Date): number {
    return (
      (to.getFullYear() - from.getFullYear()) * 12 +
      (to.getMonth() - from.getMonth())
    )
  }

  const [employees, jobs, candidates, leaveBalances, inactiveEmployees, allEmployeeCount] =
    await Promise.all([
      prisma.employee.findMany({
        where: { companyId, status: "ACTIVE" },
        include: {
          department: { select: { name: true } },
          leaveBalance: true,
          reports: { select: { id: true } },
        },
      }),
      prisma.job.findMany({
        where: { companyId },
        select: { id: true, status: true },
      }),
      prisma.candidate.findMany({
        where: { companyId },
        select: { id: true, stage: true },
      }),
      prisma.leaveBalance.findMany({
        where: { companyId },
        select: { type: true, total: true, used: true },
      }),
      prisma.employee.findMany({
        where: { companyId, status: "INACTIVE" },
        select: { managerId: true },
      }),
      prisma.employee.count({ where: { companyId } }),
    ])

  // KPIs
  const openJobs = jobs.filter((j) => j.status === "OPEN").length
  const tenures = employees.map((e) => monthsDiff(e.hireDate, now))
  const avgTenureMonths =
    tenures.length > 0
      ? Math.round(tenures.reduce((a, b) => a + b, 0) / tenures.length)
      : 0

  // Hiring funnel
  const stageOrder = ["APPLIED", "SCREENED", "INTERVIEW", "OFFER", "HIRED"]
  const stageCounts: Record<string, number> = {}
  for (const c of candidates) {
    if (c.stage !== "REJECTED") {
      stageCounts[c.stage] = (stageCounts[c.stage] ?? 0) + 1
    }
  }
  const hiringFunnel = stageOrder.map((stage) => ({
    stage,
    count: stageCounts[stage] ?? 0,
  }))

  // Department stats
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)
  const deptMap: Record<string, { headcount: number; recentHires: number }> = {}
  for (const emp of employees) {
    const deptName = emp.department?.name ?? "Unassigned"
    if (!deptMap[deptName]) deptMap[deptName] = { headcount: 0, recentHires: 0 }
    deptMap[deptName].headcount++
    if (emp.hireDate >= thirtyDaysAgo) deptMap[deptName].recentHires++
  }
  const departmentStats = Object.entries(deptMap).map(([name, stats]) => ({
    name,
    ...stats,
  }))

  // Flight risk
  const managerExitCounts = new Map<string, number>()
  for (const e of inactiveEmployees) {
    if (e.managerId) {
      managerExitCounts.set(e.managerId, (managerExitCounts.get(e.managerId) ?? 0) + 1)
    }
  }

  const flightRiskEmployees = employees
    .map((emp) => {
      const months = monthsDiff(emp.hireDate, now)
      const reasons: string[] = []
      let score = 0
      if (months < 12) { score += 40; reasons.push(`New hire (${months}mo tenure)`) }
      if (months < 6) { score += 20; reasons.push("Very new (<6 months)") }
      const totalLeave = emp.leaveBalance.reduce((s, b) => s + b.total, 0)
      const usedLeave = emp.leaveBalance.reduce((s, b) => s + b.used, 0)
      const leavePercent = totalLeave > 0 ? (usedLeave / totalLeave) * 100 : 0
      if (leavePercent < 10) { score += 20; reasons.push("Low PTO usage (<10%)") }
      const exitCount = managerExitCounts.get(emp.id) ?? 0
      if (exitCount >= 2) { score += 20; reasons.push(`Manager with ${exitCount} exits`) }
      const label: "HIGH" | "MEDIUM" | "LOW" = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW"
      return { id: emp.id, name: emp.name, department: emp.department?.name ?? "Unassigned", score, label, reasons }
    })
    .sort((a, b) => b.score - a.score)

  const highRiskEmployees = flightRiskEmployees.filter((e) => e.label === "HIGH")

  // Leave stats
  const leaveTypeMap: Record<string, { totalDays: number; usedDays: number }> = {}
  for (const lb of leaveBalances) {
    if (!leaveTypeMap[lb.type]) leaveTypeMap[lb.type] = { totalDays: 0, usedDays: 0 }
    leaveTypeMap[lb.type].totalDays += lb.total
    leaveTypeMap[lb.type].usedDays += lb.used
  }
  const leaveStats = Object.entries(leaveTypeMap).map(([type, stats]) => ({ type, ...stats }))

  // Gender
  const genderMap: Record<string, number> = {}
  for (const emp of employees) {
    const g = emp.gender ?? "Unspecified"
    genderMap[g] = (genderMap[g] ?? 0) + 1
  }
  const genderBreakdown = Object.entries(genderMap).map(([gender, count]) => ({ gender, count }))

  // AI narrative
  let aiNarrative = ""
  try {
    aiNarrative = await generateRiskNarrative(
      highRiskEmployees.map((e) => ({ name: e.name, department: e.department, reasons: e.reasons }))
    )
  } catch {
    aiNarrative = "AI narrative temporarily unavailable. Review the flight risk table below for details."
  }

  const highRiskCount = highRiskEmployees.length

  return (
    <div className="min-h-screen bg-slate-50/60">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1e40af] flex items-center justify-center shadow-md shadow-blue-500/20">
            <BarChart3 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Sora', sans-serif" }}>
              Workforce Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time insights ·{" "}
              <span style={{ fontFamily: "'DM Mono', monospace" }}>
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 lg:px-8 space-y-5 max-w-screen-xl mx-auto">
        {/* Row 1: KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Employees"
            value={allEmployeeCount}
            sub={`${employees.length} active`}
            icon={Users}
            accent="blue"
          />
          <KpiCard
            label="Open Roles"
            value={openJobs}
            sub="Actively hiring"
            icon={Briefcase}
            accent="purple"
          />
          <KpiCard
            label="Avg. Tenure"
            value={`${avgTenureMonths}mo`}
            sub="Across active staff"
            icon={Clock}
            accent="slate"
          />
          <KpiCard
            label="High Risk"
            value={highRiskCount}
            sub={`of ${employees.length} employees`}
            icon={AlertTriangle}
            accent={highRiskCount > 0 ? "amber" : "slate"}
          />
        </div>

        {/* Row 2: Funnel + Department */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Section
            title="Hiring Funnel"
            sub="Active candidates by pipeline stage"
            className="lg:col-span-3"
          >
            <HiringFunnelChart data={hiringFunnel} />
          </Section>

          <Section
            title="Department Breakdown"
            sub="Headcount distribution"
            className="lg:col-span-2"
          >
            <DepartmentBreakdown data={departmentStats} />
          </Section>
        </div>

        {/* Row 3: Flight Risk Table (full width) */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-800">Flight Risk Analysis</h2>
          </div>
          <FlightRiskTable
            employees={flightRiskEmployees}
            aiNarrative={aiNarrative}
          />
        </div>

        {/* Row 3b: Pulse Survey CTA */}
        <div
          className="rounded-xl p-5 flex items-center justify-between gap-4"
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            border: "1px solid rgba(99,102,241,0.25)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.3)" }}>
              <BarChart2 className="w-4.5 h-4.5 text-indigo-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Employee Sentiment Heatmap</p>
              <p className="text-xs mt-0.5" style={{ color: "#a5b4fc" }}>
                Track morale by department over time with anonymous pulse surveys
              </p>
            </div>
          </div>
          <Link
            href="/surveys"
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "#4f6ef7", color: "white" }}
          >
            View Surveys →
          </Link>
        </div>

        {/* Row 4: Leave + Gender */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Section
            title="Leave Overview"
            sub="Used vs. remaining days by type"
            className="lg:col-span-3"
          >
            {leaveStats.length > 0 ? (
              <LeaveOverview data={leaveStats} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
                No leave data available
              </div>
            )}
          </Section>

          <Section
            title="Gender Breakdown"
            sub="Workforce composition"
            className="lg:col-span-2"
          >
            {genderBreakdown.length > 0 ? (
              <GenderBreakdown data={genderBreakdown} />
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
                No gender data available
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}
