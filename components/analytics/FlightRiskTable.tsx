"use client"

import { Sparkles, AlertTriangle, Minus, TrendingDown } from "lucide-react"

interface FlightRiskEmployee {
  id: string
  name: string
  department: string
  score: number
  label: "HIGH" | "MEDIUM" | "LOW"
  reasons: string[]
}

interface FlightRiskTableProps {
  employees: FlightRiskEmployee[]
  aiNarrative: string
}

const LABEL_CONFIG = {
  HIGH: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    icon: AlertTriangle,
    dot: "bg-red-500",
  },
  MEDIUM: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: TrendingDown,
    dot: "bg-amber-500",
  },
  LOW: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: Minus,
    dot: "bg-emerald-500",
  },
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, score)
  const color =
    pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-amber-400" : "bg-emerald-400"

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className="text-xs font-bold tabular-nums text-slate-600 w-8 text-right"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {score}
      </span>
    </div>
  )
}

function RiskBadge({ label }: { label: "HIGH" | "MEDIUM" | "LOW" }) {
  const cfg = LABEL_CONFIG[label]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {label}
    </span>
  )
}

export function FlightRiskTable({ employees, aiNarrative }: FlightRiskTableProps) {
  const highCount = employees.filter((e) => e.label === "HIGH").length

  return (
    <div className="space-y-4">
      {/* AI Narrative */}
      <div className="relative rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />

        <div className="relative flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-300 flex items-center justify-center mt-0.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                AI Insight
              </span>
              <span className="text-[10px] text-amber-500/70">
                · claude-sonnet-4-6
              </span>
            </div>
            <p className="text-sm leading-relaxed text-amber-900 italic">
              {aiNarrative}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Employee Flight Risk
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {employees.length} employees assessed ·{" "}
              <span className="text-red-600 font-semibold">
                {highCount} high risk
              </span>
            </p>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No employee data available
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {/* Header row */}
            <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_2fr] gap-4 px-4 py-2 bg-slate-50/50">
              {["Employee", "Department", "Risk Score", "Status", "Signals"].map(
                (h) => (
                  <span
                    key={h}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                  >
                    {h}
                  </span>
                )
              )}
            </div>

            {employees.map((emp) => {
              const isHigh = emp.label === "HIGH"
              return (
                <div
                  key={emp.id}
                  className={`grid grid-cols-[2fr_1fr_1.5fr_1fr_2fr] gap-4 items-center px-4 py-3 transition-colors ${
                    isHigh
                      ? "bg-red-50/50 hover:bg-red-50/80"
                      : "hover:bg-slate-50/60"
                  }`}
                >
                  {/* Name */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {emp.name}
                    </p>
                    {isHigh && (
                      <p className="text-[10px] text-red-500 font-medium mt-0.5">
                        Immediate attention
                      </p>
                    )}
                  </div>

                  {/* Department */}
                  <p className="text-xs text-slate-500 truncate">
                    {emp.department}
                  </p>

                  {/* Score bar */}
                  <ScoreBar score={emp.score} />

                  {/* Label */}
                  <RiskBadge label={emp.label} />

                  {/* Reasons */}
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {emp.reasons.map((r, i) => (
                      <span
                        key={i}
                        className="inline-block text-[10px] text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 truncate max-w-[140px]"
                        title={r}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
