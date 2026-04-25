import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ChatInterface from "@/components/policybot/ChatInterface"
import PolicyUpload from "@/components/policybot/PolicyUpload"
import TicketList from "@/components/policybot/TicketList"
import type { Role } from "@/lib/rbac"
import Link from "next/link"

export default async function PolicyBotPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const { role, companyId, employeeId } = session.user as {
    role?: string
    companyId?: string
    employeeId?: string
  }

  const isAdmin = role === "HR_ADMIN" || role === "SUPER_ADMIN"

  // Fetch tickets for right panel (admin sees all, employee sees own)
  const tickets = isAdmin
    ? await prisma.ticket.findMany({
        where: { companyId: companyId ?? "" },
        include: { employee: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : []

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between shrink-0 px-0">
        <div>
          <h1
            className="text-2xl font-bold text-[#0f172a] tracking-tight"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            PolicyBot
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ask questions about company HR policies — powered by AI
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/policybot/tickets"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            View All Tickets
          </Link>
        )}
      </div>

      {isAdmin ? (
        /* Two-panel layout for HR Admin — chat 60% left, upload+tickets 40% right */
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left: Chat takes 60% */}
          <div className="flex-[3] min-w-0 flex flex-col min-h-0">
            <ChatInterface />
          </div>

          {/* Right: Admin panels take 40% */}
          <div className="flex-[2] shrink-0 flex flex-col gap-4 overflow-y-auto min-h-0">
            {/* Upload section */}
            <PolicyUpload />

            {/* Recent tickets */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Recent Tickets</h3>
                <Link
                  href="/policybot/tickets"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all
                </Link>
              </div>
              <TicketList initialTickets={tickets} />
            </div>
          </div>
        </div>
      ) : (
        /* Employee: full-width chat fills remaining height */
        <div className="flex-1 min-h-0 flex flex-col">
          <ChatInterface />
        </div>
      )}
    </div>
  )
}
