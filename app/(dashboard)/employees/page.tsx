import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { EmployeeSearch } from "./EmployeeSearch"
import { AddEmployeeButton } from "./AddEmployeeButton"
import type { Role } from "@/lib/rbac"

export default async function EmployeesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { role, companyId, employeeId } = session.user

  // Determine which employees to show
  let employees: Array<{
    id: string
    name: string
    title: string
    location: string
    status: string
    hireDate: Date
    department: { name: string } | null
    manager: { name: string; id: string } | null
  }> = []

  if (role === "MANAGER") {
    employees = await prisma.employee.findMany({
      where: {
        managerId: employeeId,
        companyId,
      },
      include: {
        department: { select: { name: true } },
        manager: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    })
  } else if (role === "SUPER_ADMIN") {
    let resolvedCompanyId = companyId
    if (!resolvedCompanyId) {
      const firstCompany = await prisma.company.findFirst()
      resolvedCompanyId = firstCompany?.id ?? ""
    }
    employees = await prisma.employee.findMany({
      where: { companyId: resolvedCompanyId },
      include: {
        department: { select: { name: true } },
        manager: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    })
  } else {
    employees = await prisma.employee.findMany({
      where: { companyId },
      include: {
        department: { select: { name: true } },
        manager: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    })
  }

  const isHROrAdmin = role === "HR_ADMIN" || role === "SUPER_ADMIN"

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold text-white"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {role === "MANAGER" ? "Your Team" : "Employees"}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#8b8b9e" }}>
            {employees.length} {employees.length === 1 ? "person" : "people"}
            {role === "MANAGER" ? " on your team" : " in the organization"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Org Chart link */}
          <a
            href="/employees/org-chart"
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#8b8b9e",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="6" height="5" rx="1" />
              <rect x="15" y="3" width="6" height="5" rx="1" />
              <rect x="9" y="16" width="6" height="5" rx="1" />
              <path d="M6 8v4M18 8v4M6 12h12M12 12v4" />
            </svg>
            Org Chart
          </a>

          {isHROrAdmin && <AddEmployeeButton />}
        </div>
      </div>

      {/* Table card with search */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "#111118",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <EmployeeSearch />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" id="employee-table">
            <thead>
              <tr>
                <th
                  className="text-left text-xs font-semibold uppercase tracking-wider px-5 py-3"
                  style={{ color: "#55556a", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                >
                  Name
                </th>
                <th
                  className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3"
                  style={{ color: "#55556a", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                >
                  Department
                </th>
                <th
                  className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell"
                  style={{ color: "#55556a", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                >
                  Location
                </th>
                <th
                  className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell"
                  style={{ color: "#55556a", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                >
                  Hire Date
                </th>
                <th
                  className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3"
                  style={{ color: "#55556a", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody id="employee-rows">
              {employees.map((emp) => {
                const initials = emp.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()

                return (
                  <tr
                    key={emp.id}
                    data-name={emp.name.toLowerCase()}
                    data-dept={emp.department?.name.toLowerCase() ?? ""}
                    className="transition-all duration-200 group cursor-pointer"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <td className="px-5 py-3.5">
                      <a
                        href={`/employees/${emp.id}`}
                        className="flex items-center gap-3"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                        >
                          <span className="text-xs font-bold" style={{ color: "#8b8b9e" }}>
                            {initials}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "#f1f1f3" }}>
                            {emp.name}
                          </p>
                          <p className="text-xs" style={{ color: "#55556a" }}>
                            {emp.title}
                          </p>
                        </div>
                      </a>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm" style={{ color: "#8b8b9e" }}>
                        {emp.department?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-sm" style={{ color: "#55556a" }}>
                        {emp.location ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-sm" style={{ color: "#55556a" }}>
                        {new Date(emp.hireDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={emp.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "#55556a" }}>
              No employees found
            </p>
          </div>
        )}

        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-xs" style={{ color: "#55556a" }}>
            Showing {employees.length} records
          </p>
        </div>
      </div>
    </div>
  )
}
