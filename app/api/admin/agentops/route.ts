import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()

  // Super admin only
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Fetch last 50 logs and all logs for summary in parallel
  const [recentLogs, allLogs24h, tickets] = await Promise.all([
    prisma.aiCallLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.aiCallLog.findMany({
      where: { createdAt: { gte: since } },
      select: {
        agentName: true,
        inputTokens: true,
        outputTokens: true,
        latencyMs: true,
        costUsd: true,
        response: true,
      },
    }),
    prisma.ticket.findMany({
      where: { createdAt: { gte: since } },
      select: { resolved: true },
    }),
  ])

  // Aggregate summary metrics
  const totalCalls = allLogs24h.length
  const totalCostUsd = allLogs24h.reduce((sum, log) => sum + log.costUsd, 0)
  const avgLatencyMs =
    totalCalls > 0
      ? allLogs24h.reduce((sum, log) => sum + log.latencyMs, 0) / totalCalls
      : 0

  // Group by agent
  const agentMap = new Map<
    string,
    { count: number; totalCost: number; totalLatency: number }
  >()
  for (const log of allLogs24h) {
    const existing = agentMap.get(log.agentName) ?? {
      count: 0,
      totalCost: 0,
      totalLatency: 0,
    }
    agentMap.set(log.agentName, {
      count: existing.count + 1,
      totalCost: existing.totalCost + log.costUsd,
      totalLatency: existing.totalLatency + log.latencyMs,
    })
  }

  const callsByAgent = Array.from(agentMap.entries()).map(
    ([agentName, stats]) => ({
      agentName,
      count: stats.count,
      totalCost: stats.totalCost,
      avgLatency: stats.count > 0 ? stats.totalLatency / stats.count : 0,
    })
  )

  // Task completion rate from tickets
  const resolvedTickets = tickets.filter((t) => t.resolved).length
  const taskCompletionRate =
    tickets.length > 0 ? (resolvedTickets / tickets.length) * 100 : 100

  return NextResponse.json({
    logs: recentLogs,
    summary: {
      totalCalls,
      totalCostUsd,
      avgLatencyMs,
      callsByAgent,
      taskCompletionRate,
    },
  })
}
