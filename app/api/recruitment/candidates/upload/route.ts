import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { scoreResume } from "@/lib/ai/recruitment"
import { PDFParse } from "pdf-parse"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("resume") as File | null
  const jobId = formData.get("jobId") as string
  const name = formData.get("name") as string
  const email = formData.get("email") as string

  if (!file || !jobId || !name || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Extract text from PDF
  let resumeText = ""
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({ data: buffer })
    const pdfData = await parser.getText()
    resumeText = pdfData.text ?? ""
  } catch {
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 400 })
  }

  if (!resumeText.trim()) {
    return NextResponse.json({ error: "PDF appears to be empty or unreadable" }, { status: 400 })
  }

  // Verify the job belongs to the company
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: session.user.companyId },
  })
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  // Create candidate immediately (AI scoring is non-blocking)
  const candidate = await prisma.candidate.create({
    data: {
      jobId,
      name,
      email,
      resumeText,
      aiScore: null,
      aiExplanation: null,
      stage: "APPLIED",
      companyId: session.user.companyId,
    },
  })

  // Score resume with AI in background — non-blocking
  scoreResume(resumeText, { title: job.title, requirements: job.requirements })
    .then(async (result) => {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          aiScore: result.score,
          aiExplanation: JSON.stringify({
            explanation: result.explanation,
            strengths: result.strengths,
            gaps: result.gaps,
          }),
        },
      })
    })
    .catch(console.error)

  return NextResponse.json({ candidate }, { status: 201 })
}
