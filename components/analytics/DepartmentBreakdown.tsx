"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface DeptItem {
  name: string
  headcount: number
  recentHires: number
}

interface DepartmentBreakdownProps {
  data: DeptItem[]
}

const DEPT_COLORS = [
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a78bfa", // violet-400
  "#c4b5fd", // violet-300
  "#7c3aed", // violet-600
  "#4f46e5", // indigo-600
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: DeptItem }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const dept = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg shadow-slate-200/60">
      <p className="text-xs font-semibold text-slate-800 mb-1">{dept.name}</p>
      <p className="text-sm text-slate-600">
        <span className="font-bold text-slate-900">{dept.headcount}</span> employees
      </p>
      {dept.recentHires > 0 && (
        <p className="text-xs text-emerald-600 mt-0.5">
          +{dept.recentHires} in last 30 days
        </p>
      )}
    </div>
  )
}

interface LabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
  name: string
}

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: LabelProps) {
  if (percent < 0.08) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function DepartmentBreakdown({ data }: DepartmentBreakdownProps) {
  const pieData = data.map((d) => ({ ...d, value: d.headcount }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="48%"
          outerRadius={100}
          dataKey="value"
          labelLine={false}
          label={renderCustomLabel as any}
        >
          {pieData.map((_, index) => (
            <Cell
              key={index}
              fill={DEPT_COLORS[index % DEPT_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 12, color: "#64748b" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
