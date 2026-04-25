import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ReviewForm } from "@/components/reviews/ReviewForm"
import { ArrowLeft, Star } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

const SELF_QUESTIONS = [
  {
    key: "accomplishments",
    label: "What were your biggest accomplishments this review period?",
    type: "textarea" as const,
    required: true,
    placeholder: "Describe specific projects, outcomes, or contributions...",
  },
  {
    key: "shortfalls",
    label: "What goals did you fall short on, and why?",
    type: "textarea" as const,
    required: true,
    placeholder: "Be honest — this helps identify support you might need...",
  },
  {
    key: "development",
    label: "What skills do you want to develop in the next period?",
    type: "textarea" as const,
    required: true,
    placeholder: "Technical skills, leadership, communication, etc...",
  },
  {
    key: "overallRating",
    label: "How would you rate your overall performance this period?",
    type: "rating" as const,
    required: true,
  },
  {
    key: "managerSupport",
    label: "What support do you need from your manager to succeed?",
    type: "textarea" as const,
    required: false,
    placeholder: "More feedback, clearer priorities, resources, etc...",
  },
]

const MANAGER_QUESTIONS = [
  {
    key: "strengths",
    label: "What are this employee's standout strengths?",
    type: "textarea" as const,
    required: true,
    placeholder: "Specific skills, behaviors, or contributions they excel at...",
  },
  {
    key: "growthAreas",
    label: "What are the most important growth areas for this employee?",
    type: "textarea" as const,
    required: true,
    placeholder: "Be specific and constructive — focus on behaviors, not personality...",
  },
  {
    key: "collaboration",
    label: "How effectively does this employee collaborate with the team?",
    type: "rating" as const,
    required: true,
  },
  {
    key: "overallRating",
    label: "Overall performance rating",
    type: "rating" as const,
    required: true,
  },
  {
    key: "promotionReadiness",
    label: "Is this employee on track for growth / promotion? (1=No, 3=Not yet, 5=Yes)",
    type: "rating" as const,
    required: false,
  },
]

export default async function SubmitReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ cycleId: string; type: string }>
  searchParams: Promise<{ revieweeId?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { role, employeeId } = session.user as {
    role: string
    employeeId: string
  }
  let companyId = (session.user as { companyId?: string }).companyId
  if (!companyId) {
    const first = await prisma.company.findFirst({ select: { id: true } })
    companyId = first?.id ?? ""
  }
  const { cycleId, type } = await params
  const { revieweeId } = await searchParams

  const cycle = await prisma.reviewCycle.findFirst({
    where: { id: cycleId, companyId },
  })
  if (!cycle || cycle.status !== "OPEN") redirect(`/reviews/${cycleId}`)

  const isSelf = type === "self"
  const isManagerReview = type === "manager"

  if (isSelf && !employeeId) redirect(`/reviews/${cycleId}`)
  if (isManagerReview && role !== "MANAGER" && role !== "SUPER_ADMIN" && role !== "HR_ADMIN") {
    redirect(`/reviews/${cycleId}`)
  }

  const targetRevieweeId = isSelf ? employeeId : (revieweeId ?? "")
  if (!targetRevieweeId) redirect(`/reviews/${cycleId}`)

  const reviewee = await prisma.employee.findUnique({
    where: { id: targetRevieweeId },
    select: { name: true, title: true },
  })
  if (!reviewee) redirect(`/reviews/${cycleId}`)

  const questions = isSelf ? SELF_QUESTIONS : MANAGER_QUESTIONS

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 lg:px-8">
        <Link
          href={`/reviews/${cycleId}`}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {cycle.name}
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1e40af] flex items-center justify-center">
            <Star className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Sora', sans-serif" }}>
              {isSelf ? "Self Review" : `Review: ${reviewee.name}`}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {cycle.name} · {isSelf ? "Your own assessment" : `Manager review for ${reviewee.title}`}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 lg:px-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <ReviewForm
            cycleId={cycleId}
            revieweeId={targetRevieweeId}
            reviewerRole={isSelf ? "SELF" : "MANAGER"}
            revieweeName={isSelf ? undefined : reviewee.name}
            questions={questions}
          />
        </div>
      </div>
    </div>
  )
}
