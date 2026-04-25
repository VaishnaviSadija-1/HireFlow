import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TicketList from "@/components/policybot/TicketList"
import Link from "next/link"

export default async function TicketsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const { role, companyId } = session.user as { role?: string; companyId?: string }

  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/policybot")
  }

  const tickets = await prisma.ticket.findMany({
    where: { companyId: companyId ?? "" },
    include: { employee: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })

  const totalCount = tickets.length
  const escalatedCount = tickets.filter((t) => t.escalated).length
  const openCount = tickets.filter((t) => !t.resolved).length

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/policybot"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              PolicyBot
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-900">Tickets</span>
          </div>
          <h1
            className="text-2xl font-bold text-[#0f172a] tracking-tight"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            HR Tickets
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Employee questions and escalations — all companies
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Total</p>
          <p
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {totalCount}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4">
          <p className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-1">Escalated</p>
          <p
            className="text-2xl font-bold text-amber-600"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {escalatedCount}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Open</p>
          <p
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {openCount}
          </p>
        </div>
      </div>

      {/* Ticket table */}
      <TicketList initialTickets={tickets} />
    </div>
  )
}
