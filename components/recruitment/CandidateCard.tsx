"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserIcon } from "lucide-react"

interface CandidateCardProps {
  candidate: {
    id: string
    name: string
    email: string
    aiScore: number | null
    stage: string
  }
  onViewDetails: (id: string) => void
  onStageChange: (id: string, stage: string) => void
}

const STAGES = ["APPLIED", "SCREENED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
        N/A
      </span>
    )
  }
  const colorClass =
    score >= 75
      ? "bg-emerald-100 text-emerald-700"
      : score >= 50
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700"

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}
    >
      {score}
    </span>
  )
}

export function CandidateCard({ candidate, onViewDetails, onStageChange }: CandidateCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
            <UserIcon className="size-3.5 text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{candidate.name}</p>
            <p className="truncate text-xs text-gray-500">{candidate.email}</p>
          </div>
        </div>
        <ScoreBadge score={candidate.aiScore} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <select
          value={candidate.stage}
          onChange={(e) => onStageChange(candidate.id, e.target.value)}
          className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="xs"
          onClick={() => onViewDetails(candidate.id)}
          className="shrink-0 text-xs"
        >
          Details
        </Button>
      </div>
    </div>
  )
}
