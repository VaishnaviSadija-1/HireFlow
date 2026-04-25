"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"

interface Props {
  cycleId: string
  employeeId: string
  employeeName: string
}

export function SynthesizeButton({ cycleId, employeeId, employeeName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSynthesize() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${cycleId}/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed")
      }
      toast.success(`AI summary generated for ${employeeName}`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to synthesize")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSynthesize}
      disabled={loading}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
      style={{
        background: loading ? "rgba(79,110,247,0.05)" : "rgba(79,110,247,0.1)",
        color: "#4f6ef7",
        border: "1px solid rgba(79,110,247,0.2)",
        opacity: loading ? 0.7 : 1,
      }}
    >
      <Sparkles className="w-3 h-3" />
      {loading ? "Generating..." : "Generate AI Summary"}
    </button>
  )
}
