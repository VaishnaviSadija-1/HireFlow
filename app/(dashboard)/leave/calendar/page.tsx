import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"

// Color palette for departments/employees
const COLORS = [
  "bg-blue-200 text-blue-800",
  "bg-green-200 text-green-800",
  "bg-purple-200 text-purple-800",
  "bg-amber-200 text-amber-800",
  "bg-rose-200 text-rose-800",
  "bg-cyan-200 text-cyan-800",
  "bg-indigo-200 text-indigo-800",
  "bg-orange-200 text-orange-800",
]

function getColorForId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return COLORS[hash % COLORS.length]
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

interface SearchParams {
  year?: string
  month?: string
}

export default async function LeaveCalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { role, companyId, employeeId } = session.user as {
    role: string
    companyId: string
    employeeId: string
  }

  const sp = await searchParams
  const now = new Date()
  const year = parseInt(sp.year ?? String(now.getFullYear()), 10)
  const month = parseInt(sp.month ?? String(now.getMonth()), 10)

  // Fetch approved leave requests for the month
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)

  let approvedRequests: Array<{
    id: string
    startDate: Date
    endDate: Date
    type: string
    employee: { id: string; name: string; departmentId: string | null }
  }> = []

  const baseWhere = {
    status: "APPROVED",
    startDate: { lte: monthEnd },
    endDate: { gte: monthStart },
  }

  if (role === "EMPLOYEE") {
    approvedRequests = await prisma.leaveRequest.findMany({
      where: { ...baseWhere, employeeId, companyId },
      include: { employee: { select: { id: true, name: true, departmentId: true } } },
    })
  } else if (role === "MANAGER") {
    const team = await prisma.employee.findMany({
      where: { managerId: employeeId, companyId },
      select: { id: true },
    })
    const teamIds = team.map((e) => e.id)
    approvedRequests = await prisma.leaveRequest.findMany({
      where: { ...baseWhere, employeeId: { in: teamIds }, companyId },
      include: { employee: { select: { id: true, name: true, departmentId: true } } },
    })
  } else {
    approvedRequests = await prisma.leaveRequest.findMany({
      where: { ...baseWhere, companyId },
      include: { employee: { select: { id: true, name: true, departmentId: true } } },
    })
  }

  // Build a map: day -> list of leave chips
  const daysInMonth = getDaysInMonth(year, month)
  const dayMap: Map<number, Array<{ name: string; type: string; colorClass: string }>> =
    new Map()

  for (const req of approvedRequests) {
    const colorKey = req.employee.departmentId ?? req.employee.id
    const colorClass = getColorForId(colorKey)

    const start = new Date(req.startDate)
    const end = new Date(req.endDate)

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      if (date >= start && date <= end) {
        if (!dayMap.has(d)) dayMap.set(d, [])
        dayMap.get(d)!.push({
          name: req.employee.name.split(" ")[0],
          type: req.type,
          colorClass,
        })
      }
    }
  }

  const firstDay = getFirstDayOfMonth(year, month)
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - firstDay - daysInMonth).fill(null),
  ]

  const monthName = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  })

  // Navigation
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year

  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/leave"
            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-transparent px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeftIcon className="size-3.5" />
            Back
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Leave Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/leave/calendar?year=${prevYear}&month=${prevMonth}`}
            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-transparent px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted hover:text-foreground"
          >
            &larr; Prev
          </Link>
          <span className="min-w-[140px] text-center text-sm font-medium">
            {monthName}
          </span>
          <Link
            href={`/leave/calendar?year=${nextYear}&month=${nextMonth}`}
            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-transparent px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted hover:text-foreground"
          >
            Next &rarr;
          </Link>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-lg border">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {DOW.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const isToday =
              day === now.getDate() &&
              month === now.getMonth() &&
              year === now.getFullYear()
            const isWeekend = idx % 7 === 0 || idx % 7 === 6
            const chips = day ? (dayMap.get(day) ?? []) : []

            return (
              <div
                key={idx}
                className={`min-h-[90px] border-b border-r p-1.5 last:border-r-0 ${
                  isWeekend ? "bg-muted/20" : ""
                } ${!day ? "bg-muted/10" : ""}`}
              >
                {day && (
                  <>
                    <div
                      className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {day}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {chips.slice(0, 3).map((chip, ci) => (
                        <div
                          key={ci}
                          className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${chip.colorClass}`}
                          title={`${chip.name} — ${chip.type}`}
                        >
                          {chip.name}
                        </div>
                      ))}
                      {chips.length > 3 && (
                        <div className="text-[10px] text-muted-foreground pl-1">
                          +{chips.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium">Leave types:</span>
        {[
          { type: "SICK", color: "bg-rose-200 text-rose-800" },
          { type: "CASUAL", color: "bg-amber-200 text-amber-800" },
          { type: "ANNUAL", color: "bg-blue-200 text-blue-800" },
        ].map(({ type, color }) => (
          <span
            key={type}
            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${color}`}
          >
            {type}
          </span>
        ))}
        <span className="ml-4 font-medium">Colors = department</span>
      </div>
    </div>
  )
}
