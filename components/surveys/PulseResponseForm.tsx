"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"

interface Question {
  text: string
  type: "rating" | "text"
}

interface Props {
  survey: {
    id: string
    title: string
    questions: string
  }
  deptId: string | null
}

export function PulseResponseForm({ survey, deptId }: Props) {
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const questions: Question[] = JSON.parse(survey.questions)
  const [answers, setAnswers] = useState<Record<number, { rating?: number; comment?: string }>>({})

  function setRating(i: number, v: number) {
    setAnswers((prev) => ({ ...prev, [i]: { ...prev[i], rating: v } }))
  }

  function setComment(i: number, v: string) {
    setAnswers((prev) => ({ ...prev, [i]: { ...prev[i], comment: v } }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate rating questions answered
    for (let i = 0; i < questions.length; i++) {
      if (questions[i].type === "rating" && !answers[i]?.rating) {
        toast.error("Please provide a rating for all required questions")
        return
      }
    }

    const payload = questions.map((q, i) => ({
      questionIndex: i,
      rating: answers[i]?.rating,
      comment: answers[i]?.comment,
    }))

    setLoading(true)
    try {
      const res = await fetch(`/api/surveys/${survey.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload, deptId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      setSubmitted(true)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)" }}>
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <p className="text-sm font-medium text-white">Response submitted</p>
        <p className="text-xs" style={{ color: "#8b8b9e" }}>
          Your anonymous response has been recorded. Thank you!
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {questions.map((q, i) => (
        <div key={i}>
          <p className="text-sm font-medium text-white mb-3">{q.text}</p>

          {q.type === "rating" && (
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 10 }, (_, n) => n + 1).map((n) => {
                const selected = answers[i]?.rating === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(i, n)}
                    className="w-9 h-9 rounded-lg text-sm font-semibold transition-all"
                    style={
                      selected
                        ? { background: "#4f6ef7", color: "white" }
                        : {
                            background: "rgba(255,255,255,0.05)",
                            color: "#8b8b9e",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }
                    }
                  >
                    {n}
                  </button>
                )
              })}
              <div className="w-full flex justify-between mt-1">
                <span className="text-[10px]" style={{ color: "#55556a" }}>Very unsatisfied</span>
                <span className="text-[10px]" style={{ color: "#55556a" }}>Very satisfied</span>
              </div>
            </div>
          )}

          {q.type === "text" && (
            <textarea
              rows={3}
              value={answers[i]?.comment ?? ""}
              onChange={(e) => setComment(i, e.target.value)}
              placeholder="Optional comment..."
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#55556a] outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          )}
        </div>
      ))}

      <div
        className="rounded-lg px-3 py-2 text-xs flex items-center gap-2"
        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", color: "#10b981" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Your response is completely anonymous — no personal data is stored.
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-sm font-medium transition-all"
        style={{ background: "#4f6ef7", color: "white", opacity: loading ? 0.7 : 1 }}
      >
        {loading ? "Submitting..." : "Submit Response"}
      </button>
    </form>
  )
}
