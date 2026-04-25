import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseJobDescription } from "@/lib/ai/recruitment"

export async function GET() {
  const session = await auth()
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const jobs = await prisma.job.findMany({
    where: { companyId: session.user.companyId },
    include: {
      candidates: {
        select: { id: true, stage: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, requirements, parseWithAI } = body

  if (!description) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 })
  }

  let finalTitle = title || ""
  let finalRequirements: string[] = Array.isArray(requirements) ? requirements : []
  let parsedData = null

  if (parseWithAI) {
    try {
      parsedData = await parseJobDescription(description)
      if (!finalTitle && parsedData.title) {
        finalTitle = parsedData.title
      }
      if (finalRequirements.length === 0) {
        finalRequirements = [
          ...parsedData.mustHaveSkills,
          ...parsedData.niceToHaveSkills.map((s) => `[Nice-to-have] ${s}`),
        ]
      }
    } catch (err) {
      console.error("AI parse error:", err)
      // Continue without AI parsing
    }
  }

  if (!finalTitle) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const job = await prisma.job.create({
    data: {
      title: finalTitle,
      description,
      requirements: JSON.stringify(finalRequirements),
      companyId: session.user.companyId,
      status: "OPEN",
    },
  })

  return NextResponse.json({ job, parsedData }, { status: 201 })
}
