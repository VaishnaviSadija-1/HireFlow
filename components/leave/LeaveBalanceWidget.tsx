import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Card } from "@/components/ui/card"

const LEAVE_TYPES = [
  { key: "SICK", label: "Sick Leave", color: "bg-rose-500" },
  { key: "CASUAL", label: "Casual Leave", color: "bg-amber-500" },
  { key: "ANNUAL", label: "Annual Leave", color: "bg-blue-500" },
]

interface LeaveBalanceWidgetProps {
  employeeId?: string
}

export async function LeaveBalanceWidget({ employeeId }: LeaveBalanceWidgetProps) {
  const session = await auth()
  if (!session?.user) return null

  const targetId =
    employeeId ??
    (session.user as { employeeId?: string }).employeeId ??
    ""

  const balances = await prisma.leaveBalance.findMany({
    where: { employeeId: targetId },
  })

  const getBalance = (type: string) =>
    balances.find((b) => b.type === type) ?? { total: 0, used: 0 }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {LEAVE_TYPES.map(({ key, label, color }) => {
        const { total, used } = getBalance(key)
        const remaining = Math.max(0, total - used)
        const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0

        return (
          <Card key={key} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <span className="text-2xl font-bold">{remaining}</span>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Used: {used}</span>
                <span>Total: {total}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {remaining} day{remaining !== 1 ? "s" : ""} remaining
            </p>
          </Card>
        )
      })}
    </div>
  )
}
