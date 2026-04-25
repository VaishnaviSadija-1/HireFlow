import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { JobKanban } from "./JobKanban"

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.companyId) redirect("/login")

  const { id } = await params

  const job = await prisma.job.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      candidates: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!job) notFound()

  // Parse requirements JSON
  let requirements: string[] = []
  try {
    requirements = JSON.parse(job.requirements)
  } catch {
    requirements = []
  }

  // Serialize for client component
  const serializedJob = {
    id: job.id,
    title: job.title,
    description: job.description,
    requirements,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
  }

  const serializedCandidates = job.candidates.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    resumeText: c.resumeText,
    aiScore: c.aiScore,
    aiExplanation: c.aiExplanation,
    stage: c.stage,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <JobKanban
      job={serializedJob}
      initialCandidates={serializedCandidates}
    />
  )
}
