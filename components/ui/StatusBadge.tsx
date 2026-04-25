import { cn } from "@/lib/utils"

type Status =
  | "PENDING"
  | "APPROVED"
  | "ACTIVE"
  | "HIRED"
  | "OPEN"
  | "REJECTED"
  | "INACTIVE"
  | "CLOSED"
  | "SCREENED"
  | "INTERVIEW"
  | "OFFER"

const STATUS_CONFIG: Record<
  Status,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  },
  HIRED: {
    label: "Hired",
    className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  },
  OPEN: {
    label: "Open",
    className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-500/15 text-red-400 border border-red-500/20",
  },
  INACTIVE: {
    label: "Inactive",
    className: "bg-red-500/15 text-red-400 border border-red-500/20",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-red-500/15 text-red-400 border border-red-500/20",
  },
  SCREENED: {
    label: "Screened",
    className: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  },
  INTERVIEW: {
    label: "Interview",
    className: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  },
  OFFER: {
    label: "Offer",
    className: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as Status]

  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
          "bg-white/[0.06] text-white/50 border border-white/10",
          className
        )}
      >
        {status}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
        config.className,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
      {config.label}
    </span>
  )
}
