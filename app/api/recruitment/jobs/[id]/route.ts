import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const job = await prisma.job.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      candidates: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  return NextResponse.json(job)
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
  const { status, title, description } = body

  const existing = await prisma.job.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  const updated = await prisma.job.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(title && { title }),
      ...(description && { description }),
    },
  })

  return NextResponse.json(updated)
}
