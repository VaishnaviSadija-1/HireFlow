import { Badge } from "@/components/ui/badge"
import { ApprovalActions } from "./ApprovalActions"

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED"
type LeaveType = "SICK" | "CASUAL" | "ANNUAL"

interface LeaveRequest {
  id: string
  type: string
  startDate: string | Date
  endDate: string | Date
  reason: string | null
  status: string
  employee?: { name: string; title: string } | null
}

interface LeaveRequestTableProps {
  requests: LeaveRequest[]
  showEmployee?: boolean
  canApprove?: boolean
}

function workingDays(start: Date, end: Date): number {
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

const TYPE_LABELS: Record<string, string> = {
  SICK: "Sick",
  CASUAL: "Casual",
  ANNUAL: "Annual",
}

const TYPE_COLORS: Record<string, string> = {
  SICK: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  CASUAL: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  ANNUAL: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function LeaveRequestTable({
  requests,
  showEmployee = false,
  canApprove = false,
}: LeaveRequestTableProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
        No leave requests found.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {showEmployee && (
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Employee
              </th>
            )}
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Type
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Date Range
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Duration
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Reason
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Status
            </th>
            {canApprove && (
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {requests.map((r, i) => {
            const start = new Date(r.startDate)
            const end = new Date(r.endDate)
            const days = workingDays(start, end)

            return (
              <tr
                key={r.id}
                className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${
                  i % 2 === 0 ? "" : "bg-muted/10"
                }`}
              >
                {showEmployee && (
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.employee?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.employee?.title ?? ""}
                    </div>
                  </td>
                )}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      TYPE_COLORS[r.type] ?? ""
                    }`}
                  >
                    {TYPE_LABELS[r.type] ?? r.type}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDate(start)} – {formatDate(end)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {days} day{days !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  <span
                    className="block overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground"
                    title={r.reason ?? ""}
                  >
                    {r.reason ?? <span className="italic">—</span>}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[r.status] ?? ""
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                {canApprove && (
                  <td className="px-4 py-3">
                    {r.status === "PENDING" ? (
                      <ApprovalActions requestId={r.id} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
