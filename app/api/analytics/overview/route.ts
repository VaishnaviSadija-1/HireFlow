import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateRiskNarrative } from "@/lib/ai/analytics"

// ── Flight Risk Score ─────────────────────────────────────────────────────────
function monthsDiff(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  )
}

interface FlightRiskResult {
  id: string
  name: string
  department: string
  score: number
  label: "HIGH" | "MEDIUM" | "LOW"
  reasons: string[]
}

function computeFlightRisk(
  employee: {
    id: string
    name: string
    hireDate: Date
    department: { name: string } | null
    leaveBalance: { type: string; total: number; used: number }[]
    reports: { id: string }[]
  },
  managerExitCounts: Map<string, number>,
  now: Date
): FlightRiskResult {
  const months = monthsDiff(employee.hireDate, now)
  const reasons: string[] = []
  let score = 0

  if (months < 12) {
    score += 40
    reasons.push(`New hire (${months} months tenure)`)
  }
  if (months < 6) {
    score += 20
    reasons.push("Very new hire (<6 months)")
  }

  // Leave utilization signal
  const totalLeave = employee.leaveBalance.reduce((s, b) => s + b.total, 0)
  const usedLeave = employee.leaveBalance.reduce((s, b) => s + b.used, 0)
  const leavePercent = totalLeave > 0 ? (usedLeave / totalLeave) * 100 : 0
  if (leavePercent < 10) {
    score += 20
    reasons.push("Low PTO usage (<10%)")
  }

  // Manager turnover signal
  const exitCount = managerExitCounts.get(employee.id) ?? 0
  if (exitCount >= 2) {
    score += 20
    reasons.push(`Manager with ${exitCount} team exits`)
  }

  const label: "HIGH" | "MEDIUM" | "LOW" =
    score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW"

  return {
    id: employee.id,
    name: employee.name,
    department: employee.department?.name ?? "Unassigned",
    score,
    label,
    reasons,
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { companyId, role } = session.user as {
    companyId: string
    role: string
    employeeId?: string
  }

  const isFullAccess = role === "SUPER_ADMIN" || role === "HR_ADMIN"
  if (!isFullAccess && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const now = new Date()

  // ── Parallel data fetch ───────────────────────────────────────────────────
  const [employees, jobs, candidates, leaveBalances, leaveRequests] =
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
        select: { id: true, stage: true, createdAt: true },
      }),
      prisma.leaveBalance.findMany({
        where: { companyId },
        select: { type: true, total: true, used: true },
      }),
      prisma.leaveRequest.findMany({
        where: { companyId, status: "APPROVED" },
        select: { employeeId: true, startDate: true, endDate: true, type: true },
      }),
    ])

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const activeEmployees = employees.length
  const allEmployees = await prisma.employee.count({ where: { companyId } })
  const openJobs = jobs.filter((j) => j.status === "OPEN").length

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const tenures = employees.map((e) => monthsDiff(e.hireDate, now))
  const avgTenureMonths =
    tenures.length > 0
      ? Math.round(tenures.reduce((a, b) => a + b, 0) / tenures.length)
      : 0

  // ── Hiring funnel ─────────────────────────────────────────────────────────
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

  // ── Department stats ──────────────────────────────────────────────────────
  const deptMap: Record<string, { headcount: number; recentHires: number }> = {}
  for (const emp of employees) {
    const deptName = emp.department?.name ?? "Unassigned"
    if (!deptMap[deptName]) deptMap[deptName] = { headcount: 0, recentHires: 0 }
    deptMap[deptName].headcount++
    if (emp.hireDate >= thirtyDaysAgo) {
      deptMap[deptName].recentHires++
    }
  }
  const departmentStats = Object.entries(deptMap).map(([name, stats]) => ({
    name,
    ...stats,
  }))

  // ── Flight risk ───────────────────────────────────────────────────────────
  // Count exits (INACTIVE employees) per manager
  const inactiveEmployees = await prisma.employee.findMany({
    where: { companyId, status: "INACTIVE" },
    select: { managerId: true },
  })
  const managerExitCounts = new Map<string, number>()
  for (const e of inactiveEmployees) {
    if (e.managerId) {
      managerExitCounts.set(
        e.managerId,
        (managerExitCounts.get(e.managerId) ?? 0) + 1
      )
    }
  }

  const flightRiskEmployees = employees
    .map((emp) => computeFlightRisk(emp, managerExitCounts, now))
    .sort((a, b) => b.score - a.score)

  const highRiskEmployees = flightRiskEmployees.filter(
    (e) => e.label === "HIGH"
  )

  // ── Leave stats ───────────────────────────────────────────────────────────
  const leaveTypeMap: Record<string, { totalDays: number; usedDays: number }> =
    {}
  for (const lb of leaveBalances) {
    if (!leaveTypeMap[lb.type])
      leaveTypeMap[lb.type] = { totalDays: 0, usedDays: 0 }
    leaveTypeMap[lb.type].totalDays += lb.total
    leaveTypeMap[lb.type].usedDays += lb.used
  }
  const leaveStats = Object.entries(leaveTypeMap).map(([type, stats]) => ({
    type,
    ...stats,
  }))

  // ── Gender breakdown ──────────────────────────────────────────────────────
  const genderMap: Record<string, number> = {}
  for (const emp of employees) {
    const g = emp.gender ?? "Unspecified"
    genderMap[g] = (genderMap[g] ?? 0) + 1
  }
  const genderBreakdown = Object.entries(genderMap).map(([gender, count]) => ({
    gender,
    count,
  }))

  // ── AI narrative ──────────────────────────────────────────────────────────
  let aiNarrative = ""
  try {
    aiNarrative = await generateRiskNarrative(
      highRiskEmployees.map((e) => ({
        name: e.name,
        department: e.department,
        reasons: e.reasons,
      }))
    )
  } catch (err) {
    console.error("AI narrative generation failed:", err)
    aiNarrative =
      "AI narrative temporarily unavailable. Please review the flight risk table below for details."
  }

  return NextResponse.json({
    kpis: {
      totalEmployees: allEmployees,
      activeEmployees,
      openJobs,
      avgTenureMonths,
    },
    hiringFunnel,
    departmentStats,
    flightRiskEmployees,
    leaveStats,
    genderBreakdown,
    aiNarrative,
  })
}
