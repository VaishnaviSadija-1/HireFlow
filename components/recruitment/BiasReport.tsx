"use client"

import { CheckCircleIcon, AlertTriangleIcon, AlertCircleIcon } from "lucide-react"

interface BiasFlag {
  phrase: string
  type: string
  suggestion: string
}

interface BiasReportProps {
  flags: BiasFlag[]
  overallRisk: "LOW" | "MEDIUM" | "HIGH"
}

const RISK_CONFIG = {
  LOW: {
    label: "Low Risk",
    icon: CheckCircleIcon,
    badgeClass: "bg-emerald-100 text-emerald-700",
    iconClass: "text-emerald-500",
  },
  MEDIUM: {
    label: "Medium Risk",
    icon: AlertTriangleIcon,
    badgeClass: "bg-amber-100 text-amber-700",
    iconClass: "text-amber-500",
  },
  HIGH: {
    label: "High Risk",
    icon: AlertCircleIcon,
    badgeClass: "bg-red-100 text-red-700",
    iconClass: "text-red-500",
  },
}

const TYPE_COLORS: Record<string, string> = {
  GENDER: "bg-purple-100 text-purple-700",
  AGE: "bg-orange-100 text-orange-700",
  CULTURAL: "bg-blue-100 text-blue-700",
  ABLEIST: "bg-pink-100 text-pink-700",
  EXCLUSIONARY: "bg-red-100 text-red-700",
}

export function BiasReport({ flags, overallRisk }: BiasReportProps) {
  const config = RISK_CONFIG[overallRisk]
  const RiskIcon = config.icon

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Bias Analysis</h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.badgeClass}`}
        >
          <RiskIcon className={`size-3 ${config.iconClass}`} />
          {config.label}
        </span>
      </div>

      {flags.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
          <CheckCircleIcon className="size-4 text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-700">No bias detected. Great job writing an inclusive JD!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {flags.map((flag, i) => (
            <div key={i} className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-medium text-gray-800 bg-yellow-100 rounded px-1.5 py-0.5">
                  &ldquo;{flag.phrase}&rdquo;
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    TYPE_COLORS[flag.type] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {flag.type}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                <span className="font-medium text-gray-700">Suggestion: </span>
                {flag.suggestion}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
