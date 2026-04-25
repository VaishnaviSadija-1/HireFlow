import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

interface OrgEmployee {
  id: string
  name: string
  title: string
  department: string | null
  managerId: string | null
  reports: OrgEmployee[]
}

function buildTree(
  employees: Array<{
    id: string
    name: string
    title: string
    department: { name: string } | null
    managerId: string | null
  }>,
  managerId: string | null = null
): OrgEmployee[] {
  return employees
    .filter((emp) => emp.managerId === managerId)
    .map((emp) => ({
      id: emp.id,
      name: emp.name,
      title: emp.title,
      department: emp.department?.name ?? null,
      managerId: emp.managerId,
      reports: buildTree(employees, emp.id),
    }))
}

const DEPT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Engineering: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  Sales: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  Operations: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
}

const DEFAULT_COLOR = {
  bg: "bg-slate-50",
  border: "border-slate-200",
  text: "text-slate-600",
  dot: "bg-slate-400",
}

function OrgNode({ employee, depth = 0 }: { employee: OrgEmployee; depth?: number }) {
  const colors = DEPT_COLORS[employee.department ?? ""] ?? DEFAULT_COLOR
  const initials = employee.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <a
        href={`/employees/${employee.id}`}
        className={`
          relative flex flex-col items-center gap-2 px-5 py-4 rounded-xl border-2 shadow-sm
          hover:shadow-md transition-all duration-150 cursor-pointer group min-w-[140px] max-w-[160px]
          ${colors.bg} ${colors.border}
        `}
      >
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.dot} shadow-sm`}
        >
          <span
            className="text-sm font-bold text-white"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {initials}
          </span>
        </div>
        {/* Info */}
        <div className="text-center">
          <p
            className={`text-xs font-bold leading-tight ${colors.text} group-hover:underline`}
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {employee.name}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{employee.title}</p>
        </div>
        {/* Dept tag */}
        {employee.department && (
          <span
            className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}
          >
            {employee.department}
          </span>
        )}
      </a>

      {/* Children */}
      {employee.reports.length > 0 && (
        <div className="flex flex-col items-center">
          {/* Vertical connector */}
          <div className="w-px h-6 bg-slate-200" />
          {/* Horizontal bar + children */}
          <div className="relative flex items-start gap-6">
            {/* Horizontal line across children */}
            {employee.reports.length > 1 && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-slate-200"
                style={{
                  width: `calc(100% - 80px)`,
                }}
              />
            )}
            {employee.reports.map((report) => (
              <div key={report.id} className="flex flex-col items-center">
                {/* Vertical connector from horizontal bar */}
                <div className="w-px h-6 bg-slate-200" />
                <OrgNode employee={report} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default async function OrgChartPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { companyId, role } = session.user
  let resolvedCompanyId = companyId
  if (!resolvedCompanyId && role === "SUPER_ADMIN") {
    const firstCompany = await prisma.company.findFirst()
    resolvedCompanyId = firstCompany?.id ?? ""
  }

  const employees = await prisma.employee.findMany({
    where: { companyId: resolvedCompanyId },
    select: {
      id: true,
      name: true,
      title: true,
      managerId: true,
      department: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  })

  const tree = buildTree(employees)

  // Department legend
  const depts = [...new Set(employees.map((e) => e.department?.name).filter(Boolean) as string[])]

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <a
          href="/employees"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1e40af] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Employees
        </a>
        <span className="text-slate-300">/</span>
        <h1
          className="text-xl font-bold text-[#0f172a]"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Org Chart
        </h1>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        {depts.map((dept) => {
          const colors = DEPT_COLORS[dept] ?? DEFAULT_COLOR
          return (
            <div key={dept} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
              <span className="text-xs font-medium text-slate-600">{dept}</span>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 overflow-x-auto">
        {tree.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No org chart data</p>
        ) : (
          <div className="flex gap-12 min-w-max">
            {tree.map((root) => (
              <OrgNode key={root.id} employee={root} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
