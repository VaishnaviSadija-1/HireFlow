"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"

interface Question {
  key: string
  label: string
  type: "textarea" | "rating"
  required?: boolean
  placeholder?: string
}

interface Props {
  cycleId: string
  revieweeId: string
  reviewerRole: "SELF" | "MANAGER"
  revieweeName?: string
  questions: Question[]
}

export function ReviewForm({ cycleId, revieweeId, reviewerRole, revieweeName, questions }: Props) {
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})

  function setAnswer(key: string, value: string | number) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    for (const q of questions) {
      if (q.required && !answers[q.key]) {
        toast.error(`Please answer: "${q.label}"`)
        return
      }
    }

    const overallRating = typeof answers["overallRating"] === "number" ? answers["overallRating"] : null

    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${cycleId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revieweeId,
          reviewerRole,
          answers,
          overallRating,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to submit")
      }
      setSubmitted(true)
      setTimeout(() => router.push(`/reviews/${cycleId}`), 1500)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "rgba(16,185,129,0.1)" }}
        >
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <p className="text-base font-semibold text-slate-800">Review submitted!</p>
        <p className="text-sm text-slate-400">Redirecting you back…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {revieweeName && (
        <div
          className="rounded-lg px-4 py-3 flex items-center gap-2"
          style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ background: "#1e40af", color: "white" }}
          >
            {revieweeName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-800">Reviewing: {revieweeName}</p>
            <p className="text-[10px] text-blue-600">Manager review — your responses are private until HR shares results</p>
          </div>
        </div>
      )}

      {questions.map((q) => (
        <div key={q.key}>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {q.label}
            {q.required && <span className="text-red-400 ml-1">*</span>}
          </label>

          {q.type === "rating" && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const selected = answers[q.key] === n
                const labels = ["Poor", "Below avg", "Meets exp.", "Exceeds", "Outstanding"]
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnswer(q.key, n)}
                    title={labels[n - 1]}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all hover:scale-105"
                    style={
                      selected
                        ? { background: "#4f6ef7", color: "white", borderColor: "#4f6ef7" }
                        : { background: "white", color: "#94a3b8", borderColor: "#e2e8f0" }
                    }
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          )}

          {q.type === "textarea" && (
            <textarea
              rows={4}
              value={(answers[q.key] as string) ?? ""}
              onChange={(e) => setAnswer(q.key, e.target.value)}
              placeholder={q.placeholder ?? "Your response..."}
              className="w-full px-4 py-3 rounded-xl text-sm text-slate-700 placeholder-slate-300 outline-none resize-none border focus:border-blue-300 transition-colors"
              style={{ borderColor: "#e2e8f0", background: "white" }}
            />
          )}
        </div>
      ))}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "#4f6ef7", color: "white", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </form>
  )
}
