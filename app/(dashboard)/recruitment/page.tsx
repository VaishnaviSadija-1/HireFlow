import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"
import { BriefcaseIcon, PlusIcon, UsersIcon } from "lucide-react"

const STAGE_LABELS = ["APPLIED", "SCREENED", "INTERVIEW", "OFFER", "HIRED"]

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-emerald-100 text-emerald-700" },
  CLOSED: { label: "Closed", className: "bg-gray-100 text-gray-600" },
  DRAFT: { label: "Draft", className: "bg-amber-100 text-amber-700" },
}

export default async function RecruitmentPage() {
  const session = await auth()
  if (!session?.user?.companyId) redirect("/login")

  const jobs = await prisma.job.findMany({
    where: { companyId: session.user.companyId },
    include: { candidates: { select: { id: true, stage: true } } },
    orderBy: { createdAt: "desc" },
  })

  const totalCandidates = jobs.reduce((sum, j) => sum + j.candidates.length, 0)
  const openJobs = jobs.filter((j) => j.status === "OPEN").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Recruitment</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            AI-powered candidate pipeline management
          </p>
        </div>
        <Link
          href="/recruitment/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="size-4" />
          Create Job
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Jobs</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{jobs.length}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Open</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{openJobs}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Candidates</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{totalCandidates}</p>
        </div>
      </div>

      {/* Jobs list */}
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <BriefcaseIcon className="size-10 text-slate-300 mb-3" />
          <p className="text-base font-medium text-slate-600">No jobs yet</p>
          <p className="mt-1 text-sm text-slate-400">Create your first job posting to get started</p>
          <Link
            href="/recruitment/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="size-4" />
            Create Job
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const statusConfig = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.OPEN
            const stageCounts = STAGE_LABELS.reduce<Record<string, number>>((acc, stage) => {
              acc[stage] = job.candidates.filter((c) => c.stage === stage).length
              return acc
            }, {})

            return (
              <Link
                key={job.id}
                href={`/recruitment/${job.id}`}
                className="block rounded-xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-100 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <BriefcaseIcon className="size-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-slate-900 truncate">{job.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(job.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                {/* Stage pipeline mini-view */}
                <div className="mt-4 flex items-center gap-2">
                  <UsersIcon className="size-3.5 text-slate-400 shrink-0" />
                  <div className="flex gap-3 overflow-x-auto">
                    {STAGE_LABELS.map((stage) => (
                      <div key={stage} className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-slate-400">{stage}</span>
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                          {stageCounts[stage] ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
