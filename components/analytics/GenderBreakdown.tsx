"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface GenderItem {
  gender: string
  count: number
}

interface GenderBreakdownProps {
  data: GenderItem[]
}

const GENDER_COLORS: Record<string, string> = {
  Male: "#3b82f6",
  Female: "#a78bfa",
  "Non-binary": "#34d399",
  Unspecified: "#cbd5e1",
  Other: "#fb923c",
}

function getFallbackColor(index: number): string {
  const fallbacks = ["#3b82f6", "#a78bfa", "#34d399", "#fb923c", "#f472b6"]
  return fallbacks[index % fallbacks.length]
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: GenderItem }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg shadow-slate-200/60">
      <p className="text-xs font-semibold text-slate-700">{item.gender}</p>
      <p className="text-sm text-slate-800 mt-0.5">
        <span
          className="font-bold"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {item.count}
        </span>{" "}
        <span className="text-slate-500 text-xs">
          employee{item.count !== 1 ? "s" : ""}
        </span>
      </p>
    </div>
  )
}

export function GenderBreakdown({ data }: GenderBreakdownProps) {
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="flex flex-col gap-2">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  GENDER_COLORS[entry.gender] ?? getFallbackColor(index)
                }
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: 11, color: "#64748b" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Breakdown list */}
      <div className="space-y-1.5 px-1">
        {data.map((item, i) => {
          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0"
          const color = GENDER_COLORS[item.gender] ?? getFallbackColor(i)
          return (
            <div key={item.gender} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-slate-600">{item.gender}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold text-slate-800"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {item.count}
                </span>
                <span className="text-[10px] text-slate-400 w-10 text-right"
                  style={{ fontFamily: "'DM Mono', monospace" }}>
                  {pct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
