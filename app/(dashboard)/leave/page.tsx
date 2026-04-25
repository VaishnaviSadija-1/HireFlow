import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { LeaveBalanceWidget } from "@/components/leave/LeaveBalanceWidget"
import { LeaveRequestTable } from "@/components/leave/LeaveRequestTable"
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm"
import { CalendarIcon } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function LeavePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { role, employeeId } = session.user as {
    role: string
    companyId: string
    employeeId: string
  }

  // SUPER_ADMIN may have no companyId — fall back to first company
  let companyId = (session.user as { companyId?: string }).companyId
  if (!companyId && role === "SUPER_ADMIN") {
    const first = await prisma.company.findFirst()
    companyId = first?.id ?? ""
  }

  // Fetch requests based on role
  let requests: Array<{
    id: string
    type: string
    startDate: Date
    endDate: Date
    reason: string | null
    status: string
    employee?: { name: string; title: string } | null
  }> = []

  if (role === "EMPLOYEE") {
    requests = await prisma.leaveRequest.findMany({
      where: { employeeId, companyId },
      include: { employee: { select: { name: true, title: true } } },
      orderBy: { createdAt: "desc" },
    })
  } else if (role === "MANAGER") {
    const team = await prisma.employee.findMany({
      where: { managerId: employeeId, companyId },
      select: { id: true },
    })
    const teamIds = team.map((e) => e.id)
    requests = await prisma.leaveRequest.findMany({
      where: { employeeId: { in: teamIds }, companyId },
      include: { employee: { select: { name: true, title: true } } },
      orderBy: { createdAt: "desc" },
    })
  } else if (role === "HR_ADMIN" || role === "SUPER_ADMIN") {
    requests = await prisma.leaveRequest.findMany({
      where: { companyId },
      include: { employee: { select: { name: true, title: true } } },
      orderBy: { createdAt: "desc" },
    })
  }

  const canApprove = role === "MANAGER" || role === "HR_ADMIN" || role === "SUPER_ADMIN"
  const showEmployee = role !== "EMPLOYEE"
  const pendingRequests = requests.filter((r) => r.status === "PENDING")

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {role === "EMPLOYEE"
              ? "My Leave"
              : role === "MANAGER"
              ? "Team Leave"
              : "Company Leave"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "EMPLOYEE"
              ? "Manage your leave requests and balances"
              : role === "MANAGER"
              ? "Review and approve your team's leave requests"
              : "Company-wide leave overview"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/leave/calendar"
            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-transparent px-2.5 text-[0.8rem] font-medium text-sm transition-colors hover:bg-muted hover:text-foreground"
          >
            <CalendarIcon className="size-4" />
            Calendar
          </Link>
          {role === "EMPLOYEE" && <LeaveRequestForm />}
        </div>
      </div>

      {/* Balance Widget — only for employees */}
      {role === "EMPLOYEE" && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Leave Balance
          </h2>
          <LeaveBalanceWidget />
        </section>
      )}

      {/* Pending approvals section for managers/HR */}
      {canApprove && pendingRequests.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Pending Approvals ({pendingRequests.length})
          </h2>
          <LeaveRequestTable
            requests={pendingRequests}
            showEmployee={showEmployee}
            canApprove={canApprove}
          />
        </section>
      )}

      {/* All requests */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {role === "EMPLOYEE" ? "My Requests" : "All Requests"}
        </h2>
        <LeaveRequestTable
          requests={requests}
          showEmployee={showEmployee}
          canApprove={canApprove}
        />
      </section>
    </div>
  )
}
