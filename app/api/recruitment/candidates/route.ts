import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { scoreResume } from "@/lib/ai/recruitment"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { jobId, name, email, resumeText } = body

  if (!jobId || !name || !email || !resumeText) {
    return NextResponse.json(
      { error: "jobId, name, email, and resumeText are required" },
      { status: 400 }
    )
  }

  // Verify the job belongs to the company
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: session.user.companyId },
  })
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  // Score resume with AI — fail gracefully
  let aiScore: number | null = null
  let aiExplanation: string | null = null
  let aiData: { strengths: string[]; gaps: string[] } | null = null

  try {
    const result = await scoreResume(resumeText, {
      title: job.title,
      requirements: job.requirements,
    })
    aiScore = result.score
    aiExplanation = JSON.stringify({
      explanation: result.explanation,
      strengths: result.strengths,
      gaps: result.gaps,
    })
    aiData = { strengths: result.strengths, gaps: result.gaps }
  } catch (err) {
    console.error("AI scoring error:", err)
  }

  const candidate = await prisma.candidate.create({
    data: {
      jobId,
      name,
      email,
      resumeText,
      aiScore,
      aiExplanation,
      stage: "APPLIED",
      companyId: session.user.companyId,
    },
  })

  return NextResponse.json({ candidate, aiData }, { status: 201 })
}
