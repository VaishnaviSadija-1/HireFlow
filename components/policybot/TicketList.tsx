"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

interface Employee {
  id: string
  name: string
  email: string
}

interface Ticket {
  id: string
  employeeId: string
  question: string
  aiAnswer?: string | null
  escalated: boolean
  resolved: boolean
  companyId: string
  createdAt: string | Date
  employee?: Employee
}

interface TicketListProps {
  initialTickets: Ticket[]
}

function truncate(str: string | null | undefined, len: number): string {
  if (!str) return "—"
  return str.length > len ? str.slice(0, len) + "…" : str
}

export default function TicketList({ initialTickets }: TicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [isPending, startTransition] = useTransition()
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  function handleResolve(ticketId: string) {
    setResolvingId(ticketId)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/policybot/tickets/${ticketId}`, {
          method: "PATCH",
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error ?? "Failed to resolve")
        }
        const data = await res.json() as { ticket: Ticket }
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ...data.ticket } : t))
        )
        toast.success("Ticket marked as resolved")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to resolve ticket")
      } finally {
        setResolvingId(null)
      }
    })
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          className="mx-auto mb-3 text-slate-300"
        >
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-sm font-medium">No tickets yet</p>
        <p className="text-xs mt-1">Employee questions will appear here</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Employee
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Question
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
              AI Answer
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Status
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Date
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{ticket.employee?.name ?? "—"}</p>
                  <p className="text-xs text-slate-500">{ticket.employee?.email ?? ""}</p>
                </div>
              </td>
              <td className="px-4 py-3 max-w-[200px]">
                <p className="text-slate-700" title={ticket.question}>
                  {truncate(ticket.question, 80)}
                </p>
              </td>
              <td className="px-4 py-3 max-w-[220px] hidden lg:table-cell">
                <p className="text-slate-600" title={ticket.aiAnswer ?? ""}>
                  {truncate(ticket.aiAnswer, 90)}
                </p>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  {ticket.escalated && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold border border-amber-200 w-fit">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      </svg>
                      Escalated
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border w-fit ${
                      ticket.resolved
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {ticket.resolved ? "Resolved" : "Open"}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3 text-right">
                {!ticket.resolved && (
                  <button
                    onClick={() => handleResolve(ticket.id)}
                    disabled={isPending && resolvingId === ticket.id}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPending && resolvingId === ticket.id ? "Resolving…" : "Mark Resolved"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
