"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"

export function CreateCycleSheet() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("THREE_SIXTY")
  const [startDate, setStartDate] = useState("")
  const [deadline, setDeadline] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !startDate || !deadline) {
      toast.error("Please fill in all fields")
      return
    }
    if (new Date(deadline) <= new Date(startDate)) {
      toast.error("Deadline must be after start date")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/reviews/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, startDate, deadline }),
      })
      if (!res.ok) throw new Error()
      toast.success("Review cycle created and review stubs generated")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Failed to create review cycle")
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
        New Cycle
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
          Create Review Cycle
        </h2>
        <p className="text-sm mb-5" style={{ color: "#8b8b9e" }}>
          Self-review and manager review stubs will be auto-generated for all active employees.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b8b9e" }}>
              Cycle Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q2 2025 Performance Review"
              className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-[#55556a] outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b8b9e" }}>
              Review Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <option value="THREE_SIXTY">360° (Self + Manager)</option>
              <option value="SELF_ONLY">Self Only</option>
              <option value="MANAGER_ONLY">Manager Only</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b8b9e" }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b8b9e" }}>
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.05)", color: "#8b8b9e", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ background: "#4f6ef7", color: "white", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Creating..." : "Create Cycle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
