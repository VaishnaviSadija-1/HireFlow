"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon, ChevronUpIcon, UserIcon, BrainIcon } from "lucide-react"
import { toast } from "sonner"

interface CandidateDetail {
  id: string
  name: string
  email: string
  resumeText: string
  aiScore: number | null
  stage: string
  job: {
    id: string
    title: string
  }
}

interface AiData {
  explanation: string
  strengths: string[]
  gaps: string[]
}

interface CandidateDrawerProps {
  candidateId: string | null
  open: boolean
  onClose: () => void
  onStageChange: (id: string, stage: string) => void
}

const STAGES = ["APPLIED", "SCREENED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]

function ScorePill({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="flex size-16 items-center justify-center rounded-full bg-gray-100">
        <span className="text-sm font-medium text-gray-500">N/A</span>
      </div>
    )
  }
  const [bg, text] =
    score >= 75
      ? ["bg-emerald-100", "text-emerald-700"]
      : score >= 50
      ? ["bg-amber-100", "text-amber-700"]
      : ["bg-red-100", "text-red-700"]

  return (
    <div
      className={`flex size-16 items-center justify-center rounded-full ${bg}`}
    >
      <span className={`text-xl font-bold ${text}`}>{score}</span>
    </div>
  )
}

export function CandidateDrawer({
  candidateId,
  open,
  onClose,
  onStageChange,
}: CandidateDrawerProps) {
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null)
  const [aiData, setAiData] = useState<AiData | null>(null)
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState("")

  useEffect(() => {
    if (!candidateId || !open) return
    setLoading(true)
    fetch(`/api/recruitment/candidates/${candidateId}`)
      .then((r) => r.json())
      .then((data) => {
        setCandidate(data.candidate)
        setAiData(data.aiData)
        setInterviewQuestions(data.interviewQuestions || [])
        setSelectedStage(data.candidate?.stage || "APPLIED")
      })
      .catch(() => toast.error("Failed to load candidate details"))
      .finally(() => setLoading(false))
  }, [candidateId, open])

  const handleStageChange = async (newStage: string) => {
    if (!candidate) return
    setSelectedStage(newStage)
    try {
      const res = await fetch(`/api/recruitment/candidates/${candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      })
      if (!res.ok) throw new Error()
      onStageChange(candidate.id, newStage)
      toast.success(`Stage updated to ${newStage}`)
    } catch {
      toast.error("Failed to update stage")
      setSelectedStage(candidate.stage)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="border-b border-gray-100 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="flex size-8 items-center justify-center rounded-full bg-blue-50">
              <UserIcon className="size-4 text-blue-600" />
            </div>
            {loading ? "Loading..." : candidate?.name ?? "Candidate"}
          </SheetTitle>
          {candidate && (
            <SheetDescription className="text-xs text-gray-500">
              {candidate.email} &middot; {candidate.job.title}
            </SheetDescription>
          )}
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="size-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        )}

        {!loading && candidate && (
          <div className="px-5 py-4 space-y-5">
            {/* Score + Stage */}
            <div className="flex items-center gap-4">
              <ScorePill score={candidate.aiScore} />
              <div className="flex-1">
                <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  AI Match Score
                </p>
                {aiData?.explanation && (
                  <p className="text-xs text-gray-600 leading-relaxed">{aiData.explanation}</p>
                )}
              </div>
            </div>

            {/* Stage Change */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Stage
              </p>
              <select
                value={selectedStage}
                onChange={(e) => handleStageChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Strengths */}
            {aiData?.strengths && aiData.strengths.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Strengths
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {aiData.strengths.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Gaps */}
            {aiData?.gaps && aiData.gaps.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Gaps
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {aiData.gaps.map((g, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Questions */}
            {interviewQuestions.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <BrainIcon className="size-3.5 text-blue-600" />
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    AI Interview Questions
                  </p>
                </div>
                <ol className="space-y-2">
                  {interviewQuestions.map((q, i) => (
                    <li key={i} className="rounded-lg bg-blue-50 px-3 py-2">
                      <span className="text-xs font-semibold text-blue-600 mr-1">{i + 1}.</span>
                      <span className="text-xs text-gray-700">{q}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Resume (collapsible) */}
            <div>
              <button
                onClick={() => setResumeOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span className="uppercase tracking-wide">Resume Text</span>
                {resumeOpen ? (
                  <ChevronUpIcon className="size-3.5" />
                ) : (
                  <ChevronDownIcon className="size-3.5" />
                )}
              </button>
              {resumeOpen && (
                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs text-gray-600 font-sans leading-relaxed">
                    {candidate.resumeText}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
