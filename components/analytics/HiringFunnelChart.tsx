"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface FunnelItem {
  stage: string
  count: number
}

interface HiringFunnelChartProps {
  data: FunnelItem[]
}

// Blue gradient: lightest at APPLIED, darkest at HIRED
const STAGE_COLORS = [
  "#93c5fd", // APPLIED  — blue-300
  "#60a5fa", // SCREENED — blue-400
  "#3b82f6", // INTERVIEW — blue-500
  "#2563eb", // OFFER    — blue-600
  "#1d4ed8", // HIRED    — blue-700
]

const STAGE_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  SCREENED: "Screened",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: FunnelItem }>
  label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg shadow-slate-200/60">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
        {STAGE_LABELS[item.payload.stage] ?? item.payload.stage}
      </p>
      <p className="text-lg font-bold text-slate-900">
        {item.value}{" "}
        <span className="text-sm font-normal text-slate-500">candidate{item.value !== 1 ? "s" : ""}</span>
      </p>
    </div>
  )
}

export function HiringFunnelChart({ data }: HiringFunnelChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: STAGE_LABELS[d.stage] ?? d.stage,
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
          dataKey="label"
          tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "'DM Mono', monospace" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "'DM Mono', monospace" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={64}>
          {formatted.map((_, index) => (
            <Cell key={index} fill={STAGE_COLORS[index] ?? "#3b82f6"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
