import type { LucideIcon } from "lucide-react"

interface AgentMetricCardProps {
  icon: LucideIcon
  label: string
  value: string
  description: string
  iconColor?: string
  iconBg?: string
}

export function AgentMetricCard({
  icon: Icon,
  label,
  value,
  description,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
}: AgentMetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
        {value}
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}
