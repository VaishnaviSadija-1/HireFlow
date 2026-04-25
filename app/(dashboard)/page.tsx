import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import {
  Users,
  Briefcase,
  Calendar,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import type { Role } from "@/lib/rbac"

interface StatCard {
  label: string
  value: string | number
  description: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

async function getStatsForRole(role: Role, companyId: string, employeeId: string) {
  const cards: StatCard[] = []

  if (role === "SUPER_ADMIN" || role === "HR_ADMIN") {
    const [totalEmployees, openJobs, pendingLeave, openTickets] = await Promise.all([
      prisma.employee.count({ where: { companyId } }),
      prisma.job.count({ where: { companyId, status: "OPEN" } }),
      prisma.leaveRequest.count({ where: { companyId, status: "PENDING" } }),
      prisma.ticket.count({ where: { companyId, resolved: false } }),
    ])

    cards.push(
      {
        label: "Total Employees",
        value: totalEmployees,
        description: "Active workforce headcount",
        icon: Users,
        iconColor: "#4f6ef7",
        iconBg: "rgba(79,110,247,0.15)",
      },
      {
        label: "Open Positions",
        value: openJobs,
        description: "Jobs actively recruiting",
        icon: Briefcase,
        iconColor: "#22c55e",
        iconBg: "rgba(34,197,94,0.15)",
      },
      {
        label: "Pending Leave",
        value: pendingLeave,
        description: "Requests awaiting approval",
        icon: Calendar,
        iconColor: "#f59e0b",
        iconBg: "rgba(245,158,11,0.15)",
      },
      {
        label: "Open Tickets",
        value: openTickets,
        description: "Support tickets unresolved",
        icon: MessageCircle,
        iconColor: "#a78bfa",
        iconBg: "rgba(167,139,250,0.15)",
      }
    )
  } else if (role === "MANAGER") {
    const [teamSize, pendingApprovals, openTickets] = await Promise.all([
      prisma.employee.count({
        where: { managerId: employeeId, companyId },
      }),
      prisma.leaveRequest.count({
        where: { managerId: employeeId, companyId, status: "PENDING" },
      }),
      prisma.ticket.count({ where: { companyId, resolved: false } }),
    ])

    cards.push(
      {
        label: "Team Size",
        value: teamSize,
        description: "Direct reports",
        icon: Users,
        iconColor: "#4f6ef7",
        iconBg: "rgba(79,110,247,0.15)",
      },
      {
        label: "Leave Approvals",
        value: pendingApprovals,
        description: "Pending your approval",
        icon: Clock,
        iconColor: "#f59e0b",
        iconBg: "rgba(245,158,11,0.15)",
      },
      {
        label: "Open Tickets",
        value: openTickets,
        description: "Company support tickets",
        icon: AlertCircle,
        iconColor: "#a78bfa",
        iconBg: "rgba(167,139,250,0.15)",
      },
      {
        label: "Team Status",
        value: "Active",
        description: "All members present",
        icon: CheckCircle2,
        iconColor: "#22c55e",
        iconBg: "rgba(34,197,94,0.15)",
      }
    )
  } else {
    const [annualBalance, pendingLeave, approvedLeave, myTickets] = await Promise.all([
      prisma.leaveBalance.findFirst({
        where: { employeeId, type: "ANNUAL", companyId },
      }),
      prisma.leaveRequest.count({
        where: { employeeId, status: "PENDING" },
      }),
      prisma.leaveRequest.count({
        where: { employeeId, status: "APPROVED" },
      }),
      prisma.ticket.count({
        where: { employeeId, resolved: false },
      }),
    ])

    const remaining = annualBalance
      ? annualBalance.total - annualBalance.used
      : 0

    cards.push(
      {
        label: "Leave Balance",
        value: `${remaining} days`,
        description: "Annual leave remaining",
        icon: Calendar,
        iconColor: "#4f6ef7",
        iconBg: "rgba(79,110,247,0.15)",
      },
      {
        label: "Pending Requests",
        value: pendingLeave,
        description: "Leave requests awaiting approval",
        icon: Clock,
        iconColor: "#f59e0b",
        iconBg: "rgba(245,158,11,0.15)",
      },
      {
        label: "Approved Leave",
        value: approvedLeave,
        description: "This year",
        icon: CheckCircle2,
        iconColor: "#22c55e",
        iconBg: "rgba(34,197,94,0.15)",
      },
      {
        label: "Open Tickets",
        value: myTickets,
        description: "Your support requests",
        icon: MessageCircle,
        iconColor: "#a78bfa",
        iconBg: "rgba(167,139,250,0.15)",
      }
    )
  }

  return cards
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { role, companyId, employeeId, name } = session.user

  let resolvedCompanyId = companyId
  if (!resolvedCompanyId && role === "SUPER_ADMIN") {
    const firstCompany = await prisma.company.findFirst()
    resolvedCompanyId = firstCompany?.id ?? ""
  }

  const cards = await getStatsForRole(role as Role, resolvedCompanyId, employeeId)

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const firstName = name?.split(" ")[0] ?? "there"

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-sm mb-1" style={{ color: "#55556a" }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1
          className="text-2xl font-semibold text-white"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#8b8b9e" }}>
          Here&apos;s what&apos;s happening in your workspace today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              className="rounded-xl p-5 transition-all duration-200 border border-white/[0.07] hover:border-white/[0.15]"
              style={{ background: "#111118" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: card.iconBg }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
                </div>
              </div>
              <div>
                <p
                  className="text-3xl font-light text-white mb-0.5"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {card.value}
                </p>
                <p className="text-sm font-medium mb-0.5" style={{ color: "#f1f1f3" }}>
                  {card.label}
                </p>
                <p className="text-xs" style={{ color: "#55556a" }}>
                  {card.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="rounded-xl p-6"
          style={{
            background: "#111118",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <h2
            className="text-sm font-bold mb-4 uppercase tracking-wider"
            style={{ fontFamily: "'Sora', sans-serif", color: "#55556a" }}
          >
            Quick Actions
          </h2>
          <div className="space-y-1">
            {(role === "SUPER_ADMIN" || role === "HR_ADMIN") && (
              <>
                <QuickLink href="/employees" label="View all employees" />
                <QuickLink href="/recruitment" label="Review candidates" />
                <QuickLink href="/leave" label="Manage leave requests" />
              </>
            )}
            {role === "MANAGER" && (
              <>
                <QuickLink href="/employees" label="View your team" />
                <QuickLink href="/leave" label="Review leave approvals" />
                <QuickLink href="/policybot" label="Ask PolicyBot" />
              </>
            )}
            {role === "EMPLOYEE" && (
              <>
                <QuickLink href="/leave" label="Request leave" />
                <QuickLink href="/policybot" label="Ask PolicyBot" />
              </>
            )}
          </div>
        </div>

        {/* PolicyBot CTA */}
        <div
          className="rounded-xl p-6 relative overflow-hidden"
          style={{
            background: "#111118",
            border: "1px solid rgba(79,110,247,0.25)",
          }}
        >
          {/* Subtle glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 300px 200px at 80% 20%, rgba(79,110,247,0.08) 0%, transparent 70%)",
            }}
          />
          <div className="relative">
            <h2
              className="text-sm font-bold mb-2 uppercase tracking-wider"
              style={{ fontFamily: "'Sora', sans-serif", color: "#4f6ef7" }}
            >
              PolicyBot
            </h2>
            <p
              className="text-lg font-semibold mb-1 text-white"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Ask anything about company policy
            </p>
            <p className="text-sm mb-4" style={{ color: "#8b8b9e" }}>
              Instant answers from your HR documentation. Escalates to HR when needed.
            </p>
            <a
              href="/policybot"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background: "#4f6ef7",
                color: "#ffffff",
                boxShadow: "0 4px 14px rgba(79,110,247,0.35)",
              }}
            >
              Open PolicyBot
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickLink({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 text-[#8b8b9e] hover:bg-white/[0.04] hover:text-[#f1f1f3]"
    >
      <span className="text-sm font-medium">{label}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#4f6ef7" }}>
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </a>
  )
}
