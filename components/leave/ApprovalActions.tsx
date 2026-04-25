"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ApprovalActionsProps {
  requestId: string
  onUpdate?: () => void
}

export function ApprovalActions({ requestId, onUpdate }: ApprovalActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)
  const [, startTransition] = useTransition()

  async function handleAction(action: "approve" | "reject") {
    setLoading(action)
    try {
      const res = await fetch(`/api/leave/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "approve" ? "APPROVED" : "REJECTED",
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update")
      }

      toast.success(
        action === "approve" ? "Leave approved" : "Leave rejected"
      )

      // Use startTransition so React batches the router refresh properly
      startTransition(() => {
        router.refresh()
      })

      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950"
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
        title="Approve"
      >
        {loading === "approve" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Check className="size-4" />
        )}
        <span className="sr-only">Approve</span>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
        title="Reject"
      >
        {loading === "reject" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <X className="size-4" />
        )}
        <span className="sr-only">Reject</span>
      </Button>
    </div>
  )
}
