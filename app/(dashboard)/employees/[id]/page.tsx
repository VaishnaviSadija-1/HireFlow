import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { StatusBadge } from "@/components/ui/StatusBadge"
import {
  MapPin,
  Calendar,
  ArrowLeft,
  User,
  Building2,
} from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeProfilePage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      department: { select: { name: true } },
      manager: { select: { id: true, name: true, title: true } },
      reports: {
        select: { id: true, name: true, title: true, status: true },
      },
      leaveReqs: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          type: true,
          startDate: true,
          endDate: true,
          status: true,
          reason: true,
        },
      },
    },
  })

  if (!employee) notFound()

  const skills: string[] = employee.skills
    ? JSON.parse(employee.skills as string)
    : []

  const initials = employee.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back link */}
      <a
        href="/employees"
        className="inline-flex items-center gap-1.5 text-sm mb-5 transition-all duration-200 text-[#8b8b9e] hover:text-[#4f6ef7]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to employees
      </a>

      {/* Profile header — clean dark card, no gradient */}
      <div
        className="rounded-xl overflow-hidden mb-5"
        style={{
          background: "#111118",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="px-6 py-6">
          <div className="flex items-start gap-5 mb-5">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(79,110,247,0.15)",
                border: "1px solid rgba(79,110,247,0.3)",
              }}
            >
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: "'Sora', sans-serif", color: "#4f6ef7" }}
              >
                {initials}
              </span>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h1
                className="text-2xl font-semibold text-white mb-1"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {employee.name}
              </h1>
              <p className="text-sm mb-3" style={{ color: "#8b8b9e" }}>
                {employee.title}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                {employee.department && (
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: "#8b8b9e" }}>
                    <Building2 className="w-3.5 h-3.5" />
                    {employee.department.name}
                  </div>
                )}
                {employee.location && (
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: "#8b8b9e" }}>
                    <MapPin className="w-3.5 h-3.5" />
                    {employee.location}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm" style={{ color: "#8b8b9e" }}>
                  <Calendar className="w-3.5 h-3.5" />
                  Joined{" "}
                  {new Date(employee.hireDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div className="pt-1 shrink-0">
              <StatusBadge status={employee.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-5">
          {/* Skills */}
          {skills.length > 0 && (
            <div
              className="rounded-xl p-5"
              style={{
                background: "#111118",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <h2
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ fontFamily: "'Sora', sans-serif", color: "#55556a" }}
              >
                Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: "rgba(79,110,247,0.1)",
                      border: "1px solid rgba(79,110,247,0.2)",
                      color: "#4f6ef7",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Manager */}
          <div
            className="rounded-xl p-5"
            style={{
              background: "#111118",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ fontFamily: "'Sora', sans-serif", color: "#55556a" }}
            >
              Reports To
            </h2>
            {employee.manager ? (
              <a
                href={`/employees/${employee.manager.id}`}
                className="flex items-center gap-3 p-2 rounded-lg transition-all duration-200 group hover:bg-white/[0.04]"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <span className="text-xs font-bold" style={{ color: "#8b8b9e" }}>
                    {employee.manager.name
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold transition-colors" style={{ color: "#f1f1f3" }}>
                    {employee.manager.name}
                  </p>
                  <p className="text-xs" style={{ color: "#55556a" }}>
                    {employee.manager.title}
                  </p>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-2 text-sm p-2" style={{ color: "#55556a" }}>
                <User className="w-4 h-4" />
                No manager assigned
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Direct reports */}
          {employee.reports.length > 0 && (
            <div
              className="rounded-xl p-5"
              style={{
                background: "#111118",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <h2
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ fontFamily: "'Sora', sans-serif", color: "#55556a" }}
                >
                  Direct Reports
                </h2>
                <span className="text-xs" style={{ color: "#55556a" }}>
                  ({employee.reports.length})
                </span>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {employee.reports.map((report) => (
                  <a
                    key={report.id}
                    href={`/employees/${report.id}`}
                    className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg transition-all duration-200 hover:bg-white/[0.03] border-b border-white/[0.05]"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <span className="text-xs font-bold" style={{ color: "#8b8b9e" }}>
                        {report.name
                          .split(" ")
                          .map((w: string) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#f1f1f3" }}>
                        {report.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#55556a" }}>
                        {report.title}
                      </p>
                    </div>
                    <StatusBadge status={report.status} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Leave history */}
          <div
            className="rounded-xl p-5"
            style={{
              background: "#111118",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ fontFamily: "'Sora', sans-serif", color: "#55556a" }}
            >
              Recent Leave History
            </h2>
            {employee.leaveReqs.length === 0 ? (
              <p className="text-sm py-2" style={{ color: "#55556a" }}>
                No leave requests
              </p>
            ) : (
              <div className="space-y-2">
                {employee.leaveReqs.map((lr) => (
                  <div
                    key={lr.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <div>
                      <p className="text-sm font-medium capitalize" style={{ color: "#f1f1f3" }}>
                        {lr.type.toLowerCase()} leave
                      </p>
                      <p className="text-xs" style={{ color: "#55556a" }}>
                        {new Date(lr.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        –{" "}
                        {new Date(lr.endDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <StatusBadge status={lr.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
