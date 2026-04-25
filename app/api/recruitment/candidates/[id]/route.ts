import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateInterviewQuestions } from "@/lib/ai/recruitment"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const candidate = await prisma.candidate.findFirst({
    where: { id, companyId: session.user.companyId },
    include: { job: true },
  })

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
  }

  // Parse aiExplanation to get structured data
  let aiData: {
    explanation: string
    strengths: string[]
    gaps: string[]
  } | null = null

  if (candidate.aiExplanation) {
    try {
      aiData = JSON.parse(candidate.aiExplanation)
    } catch {
      aiData = null
    }
  }

  // Generate interview questions if candidate is in SCREENED or INTERVIEW stage
  let interviewQuestions: string[] = []
  if (
    (candidate.stage === "SCREENED" || candidate.stage === "INTERVIEW") &&
    aiData?.gaps &&
    aiData.gaps.length > 0
  ) {
    try {
      interviewQuestions = await generateInterviewQuestions(aiData.gaps, candidate.job.title)
    } catch (err) {
      console.error("Error generating interview questions:", err)
    }
  }

  return NextResponse.json({ candidate, aiData, interviewQuestions })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { stage } = body

  const validStages = ["APPLIED", "SCREENED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]
  if (stage && !validStages.includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 })
  }

  const existing = await prisma.candidate.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
  }

  const updated = await prisma.candidate.update({
    where: { id },
    data: { stage },
  })

  return NextResponse.json(updated)
}
