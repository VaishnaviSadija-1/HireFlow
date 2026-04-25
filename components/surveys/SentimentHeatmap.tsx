"use client"

import { useState } from "react"

interface DeptWeek {
  deptId: string
  deptName: string
  avgRating: number | null
  responseCount: number
  keywords: { theme: string; count: number }[]
}

interface WeekData {
  week: string
  depts: DeptWeek[]
}

interface Props {
  heatmap: WeekData[]
  departments: { id: string; name: string }[]
}

function ratingColor(rating: number | null): string {
  if (rating === null) return "#1a1a24"
  if (rating >= 8) return "#059669"   // green
  if (rating >= 6) return "#d97706"   // amber
  if (rating >= 4) return "#ea580c"   // orange
  return "#dc2626"                     // red
}

function ratingBg(rating: number | null): string {
  if (rating === null) return "rgba(255,255,255,0.03)"
  if (rating >= 8) return "rgba(5,150,105,0.15)"
  if (rating >= 6) return "rgba(217,119,6,0.15)"
  if (rating >= 4) return "rgba(234,88,12,0.15)"
  return "rgba(220,38,38,0.15)"
}

function ratingLabel(rating: number | null): string {
  if (rating === null) return "No data"
  if (rating >= 8) return "Positive"
  if (rating >= 6) return "Neutral"
  if (rating >= 4) return "Concerning"
  return "Critical"
}

export function SentimentHeatmap({ heatmap, departments }: Props) {
  const [tooltip, setTooltip] = useState<{
    week: string
    dept: DeptWeek
    x: number
    y: number
  } | null>(null)

  if (heatmap.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: "#55556a" }}>
        No survey responses yet. Share the survey with employees to see sentiment data here.
      </div>
    )
  }

  // Get unique dept names across all weeks
  const allDepts = Array.from(
    new Map(
      heatmap.flatMap((w) => w.depts.map((d) => [d.deptId, d.deptName]))
    ).entries()
  ).map(([id, name]) => ({ id, name }))

  const weeks = heatmap.map((w) => w.week)

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-5">
        {[
          { label: "Positive (8–10)", color: "#059669", bg: "rgba(5,150,105,0.15)" },
          { label: "Neutral (6–7)", color: "#d97706", bg: "rgba(217,119,6,0.15)" },
          { label: "Concerning (4–5)", color: "#ea580c", bg: "rgba(234,88,12,0.15)" },
          { label: "Critical (1–3)", color: "#dc2626", bg: "rgba(220,38,38,0.15)" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.bg, border: `1px solid ${l.color}` }} />
            <span className="text-xs" style={{ color: "#8b8b9e" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${Math.max(300, weeks.length * 90 + 140)}px` }}>
          <thead>
            <tr>
              <th className="text-left text-xs font-medium pb-3 pr-4 w-32" style={{ color: "#55556a" }}>
                Department
              </th>
              {weeks.map((week) => (
                <th key={week} className="text-center text-xs font-medium pb-3 px-1" style={{ color: "#55556a" }}>
                  {new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allDepts.map((dept) => (
              <tr key={dept.id}>
                <td className="text-xs font-medium pr-4 py-1.5 truncate max-w-[120px]" style={{ color: "#c9c9d4" }}>
                  {dept.name}
                </td>
                {weeks.map((week, wi) => {
                  const weekData = heatmap[wi]
                  const cell = weekData?.depts.find((d) => d.deptId === dept.id)
                  const rating = cell?.avgRating ?? null

                  return (
                    <td key={week} className="px-1 py-1.5">
                      <div
                        className="relative h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                        style={{ background: ratingBg(rating), border: `1px solid ${ratingColor(rating)}33` }}
                        onMouseEnter={(e) => {
                          if (cell) {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setTooltip({ week, dept: cell, x: rect.left, y: rect.bottom + 8 })
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        {rating !== null ? (
                          <span
                            className="text-sm font-bold"
                            style={{ color: ratingColor(rating), fontFamily: "'DM Mono', monospace" }}
                          >
                            {rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "#3a3a4d" }}>—</span>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl p-3 shadow-2xl"
          style={{
            left: Math.min(tooltip.x, window.innerWidth - 240),
            top: tooltip.y,
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.1)",
            width: 220,
          }}
        >
          <p className="text-xs font-semibold text-white mb-1">{tooltip.dept.deptName}</p>
          <p className="text-[10px] mb-2" style={{ color: "#8b8b9e" }}>
            Week of {new Date(tooltip.week).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: "#8b8b9e" }}>Avg score</span>
            <span
              className="text-sm font-bold"
              style={{ color: ratingColor(tooltip.dept.avgRating), fontFamily: "'DM Mono', monospace" }}
            >
              {tooltip.dept.avgRating?.toFixed(1) ?? "—"} / 10
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: "#8b8b9e" }}>Responses</span>
            <span className="text-xs font-medium text-white">{tooltip.dept.responseCount}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs" style={{ color: "#8b8b9e" }}>Sentiment</span>
            <span className="text-xs font-medium" style={{ color: ratingColor(tooltip.dept.avgRating) }}>
              {ratingLabel(tooltip.dept.avgRating)}
            </span>
          </div>
          {tooltip.dept.keywords.length > 0 && (
            <>
              <p className="text-[10px] font-medium mb-1.5" style={{ color: "#55556a" }}>Top themes</p>
              <div className="flex flex-wrap gap-1">
                {tooltip.dept.keywords.slice(0, 4).map((kw) => (
                  <span
                    key={kw.theme}
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(79,110,247,0.15)", color: "#818cf8" }}
                  >
                    {kw.theme}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
