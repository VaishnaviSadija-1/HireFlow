"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Activity, Zap, DollarSign, Clock } from "lucide-react"
import { AgentMetricCard } from "@/components/admin/AgentMetricCard"

interface AiCallLog {
  id: string
  agentName: string
  prompt: string
  response: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  costUsd: number
  companyId: string | null
  createdAt: string
}

interface AgentStat {
  agentName: string
  count: number
  totalCost: number
  avgLatency: number
}

interface Summary {
  totalCalls: number
  totalCostUsd: number
  avgLatencyMs: number
  callsByAgent: AgentStat[]
  taskCompletionRate: number
}

interface AgentOpsData {
  logs: AiCallLog[]
  summary: Summary
}

function formatCost(usd: number): string {
  if (usd === 0) return "$0.0000"
  return `$${usd.toFixed(4)}`
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function isErrorRow(log: AiCallLog): boolean {
  return log.response.startsWith("ERROR:")
}

export default function AgentOpsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [data, setData] = useState<AgentOpsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Auth guard — client-side
  useEffect(() => {
    if (status === "loading") return
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      router.replace("/")
    }
  }, [session, status, router])

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "SUPER_ADMIN") return

    fetch("/api/admin/agentops")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [status, session])

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 font-mono">Loading observability data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 text-sm font-mono">
        Error loading AgentOps data: {error}
      </div>
    )
  }

  if (!data) return null

  const { logs, summary } = data

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-blue-600" />
            <h1
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              AgentOps Monitor
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            AI agent observability and performance tracking &mdash; last 24h
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700 font-mono">LIVE</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AgentMetricCard
          icon={Activity}
          label="Total API Calls (24h)"
          value={summary.totalCalls.toString()}
          description="All AI agent invocations in the last 24 hours"
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <AgentMetricCard
          icon={DollarSign}
          label="Total Cost (24h)"
          value={formatCost(summary.totalCostUsd)}
          description="Estimated Claude API spend based on token usage"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <AgentMetricCard
          icon={Clock}
          label="Avg Latency"
          value={formatLatency(summary.avgLatencyMs)}
          description="Mean end-to-end response time across all agents"
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <AgentMetricCard
          icon={Zap}
          label="Task Completion Rate"
          value={`${summary.taskCompletionRate.toFixed(0)}%`}
          description="Resolved tickets / total tickets in the last 24 hours"
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
      </div>

      {/* Calls by Agent */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Zap className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Calls by Agent</h2>
        </div>
        {summary.callsByAgent.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-400 font-mono">
            No agent calls recorded in the last 24 hours.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Calls
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Avg Latency
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {summary.callsByAgent.map((agent) => (
                  <tr key={agent.agentName} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {agent.agentName}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-slate-700 text-xs">
                      {agent.count}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-slate-700 text-xs">
                      {formatLatency(agent.avgLatency)}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-slate-700 text-xs">
                      {formatCost(agent.totalCost)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        Healthy
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent AI Calls Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Recent AI Calls</h2>
          <span className="ml-auto text-xs text-slate-400 font-mono">
            last {logs.length} entries
          </span>
        </div>
        {logs.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-400 font-mono">
            No AI calls recorded in the last 24 hours.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tokens In
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tokens Out
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Latency
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => {
                  const isError = isErrorRow(log)
                  return (
                    <tr
                      key={log.id}
                      className={
                        isError
                          ? "bg-red-50 hover:bg-red-100 transition-colors"
                          : "hover:bg-slate-50 transition-colors"
                      }
                    >
                      <td className="px-4 py-2.5 font-mono text-slate-500">
                        {formatTimestamp(log.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`font-mono px-1.5 py-0.5 rounded text-xs ${
                            isError
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {log.agentName}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                        {log.inputTokens.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                        {log.outputTokens.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                        {formatLatency(log.latencyMs)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                        {formatCost(log.costUsd)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {isError ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-700 text-xs font-semibold">
                            <div className="w-1 h-1 rounded-full bg-red-500" />
                            Error
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
