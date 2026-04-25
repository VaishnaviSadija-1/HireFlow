"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface LeaveItem {
  type: string
  totalDays: number
  usedDays: number
}

interface LeaveOverviewProps {
  data: LeaveItem[]
}

const TYPE_LABELS: Record<string, string> = {
  SICK: "Sick",
  CASUAL: "Casual",
  ANNUAL: "Annual",
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg shadow-slate-200/60 min-w-[140px]">
      <p className="text-xs font-semibold text-slate-700 mb-2">
        {TYPE_LABELS[label ?? ""] ?? label}
      </p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-sm inline-block"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-xs text-slate-500">{p.name}</span>
          </div>
          <span
            className="text-xs font-bold text-slate-800"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {p.value}d
          </span>
        </div>
      ))}
    </div>
  )
}

export function LeaveOverview({ data }: LeaveOverviewProps) {
  const formatted = data.map((d) => ({
    type: d.type,
    Used: d.usedDays,
    Remaining: Math.max(0, d.totalDays - d.usedDays),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={formatted}
        margin={{ top: 8, right: 16, left: -8, bottom: 4 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f1f5f9"
          vertical={false}
        />
        <XAxis
          dataKey="type"
          tickFormatter={(v) => TYPE_LABELS[v] ?? v}
          tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "'DM Mono', monospace" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "'DM Mono', monospace" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 11, color: "#64748b" }}>{value}</span>
          )}
        />
        <Bar dataKey="Used" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
        <Bar
          dataKey="Remaining"
          stackId="a"
          fill="#e0e7ff"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
