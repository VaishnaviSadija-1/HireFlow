"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon, Trash2Icon } from "lucide-react"

interface Question {
  text: string
  type: "rating" | "text"
}

export function CreateSurveySheet() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [cadence, setCadence] = useState("ONE_TIME")
  const [targetType, setTargetType] = useState("ALL")
  const [endsAt, setEndsAt] = useState("")
  const [questions, setQuestions] = useState<Question[]>([
    { text: "How satisfied are you with your work this week?", type: "rating" },
    { text: "Is there anything specific on your mind? (optional)", type: "text" },
  ])

  function addQuestion() {
    if (questions.length >= 2) {
      toast.error("Maximum 2 questions per survey")
      return
    }
    setQuestions([...questions, { text: "", type: "rating" }])
  }

  function removeQuestion(i: number) {
    setQuestions(questions.filter((_, idx) => idx !== i))
  }

  function updateQuestion(i: number, field: keyof Question, value: string) {
    setQuestions(questions.map((q, idx) => (idx === i ? { ...q, [field]: value } : q)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || questions.some((q) => !q.text.trim())) {
      toast.error("Please fill in all fields")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, questions, cadence, targetType, endsAt: endsAt || null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Survey created and sent to employees")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Failed to create survey")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
        style={{ background: "#4f6ef7", color: "white" }}
      >
        <PlusIcon className="w-4 h-4" />
        New Survey
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl p-6 shadow-2xl"
        style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
          Create Pulse Survey
        </h2>
        <p className="text-sm mb-5" style={{ color: "#8b8b9e" }}>
          Employees respond anonymously. Max 2 questions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b8b9e" }}>
              Survey Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Morale Check"
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#55556a] outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b8b9e" }}>
                Cadence
              </label>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <option value="ONE_TIME">One Time</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Biweekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b8b9e" }}>
                Target
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <option value="ALL">All Employees</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b8b9e" }}>
              End Date (optional)
            </label>
            <input
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium" style={{ color: "#8b8b9e" }}>
                Questions ({questions.length}/2)
              </label>
              {questions.length < 2 && (
                <button
                  type="button"
                  onClick={addQuestion}
                  className="text-xs px-2 py-1 rounded-md transition-all"
                  style={{ color: "#4f6ef7", background: "rgba(79,110,247,0.1)" }}
                >
                  + Add question
                </button>
              )}
            </div>
            {questions.map((q, i) => (
              <div
                key={i}
                className="rounded-xl p-3 space-y-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-2">
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(i, "type", e.target.value)}
                    className="text-xs px-2 py-1 rounded-md text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <option value="rating">1–10 Rating</option>
                    <option value="text">Free Text</option>
                  </select>
                  <span className="flex-1" />
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(i)}
                      className="p-1 rounded"
                      style={{ color: "#55556a" }}
                    >
                      <Trash2Icon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(i, "text", e.target.value)}
                  placeholder="Question text..."
                  className="w-full px-2 py-1.5 rounded-lg text-sm text-white placeholder-[#55556a] outline-none bg-transparent"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.05)", color: "#8b8b9e", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: "#4f6ef7", color: "white", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Creating..." : "Create Survey"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
