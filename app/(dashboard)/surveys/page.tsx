import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CreateSurveySheet } from "@/components/surveys/CreateSurveySheet"
import { PulseResponseForm } from "@/components/surveys/PulseResponseForm"
import { BarChart2, Clock, Users } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SurveysPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { role, employeeId } = session.user as {
    role: string
    employeeId: string
  }

  // SUPER_ADMIN has no companyId — fall back to first company
  let companyId = (session.user as { companyId?: string }).companyId
  if (!companyId) {
    const first = await prisma.company.findFirst({ select: { id: true } })
    companyId = first?.id ?? ""
  }

  const isAdmin = role === "SUPER_ADMIN" || role === "HR_ADMIN"

  const surveys = await prisma.pulseSurvey.findMany({
    where: { companyId, active: true },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { responses: true } } },
  })

  // For employee: find their dept to pass to response form
  let deptId: string | null = null
  if (employeeId) {
    const emp = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { departmentId: true },
    })
    deptId = emp?.departmentId ?? null
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center shadow-md shadow-violet-500/20">
              <BarChart2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1
                className="text-lg font-bold text-slate-900"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Pulse Surveys
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Anonymous employee sentiment · real-time insights
              </p>
            </div>
          </div>
          {isAdmin && <CreateSurveySheet />}
        </div>
      </div>

      <div className="px-6 py-6 lg:px-8 max-w-screen-xl mx-auto">
        {surveys.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-violet-500" />
            </div>
            <p className="text-sm font-medium text-slate-700">No active surveys</p>
            <p className="text-xs text-slate-400 max-w-xs">
              {isAdmin
                ? "Create a pulse survey to start collecting anonymous employee feedback."
                : "No surveys are active right now. Check back soon."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {surveys.map((survey) => {
              const questions: { text: string; type: string }[] = JSON.parse(survey.questions)
              return (
                <div
                  key={survey.id}
                  className="bg-white rounded-xl border border-slate-100 overflow-hidden"
                >
                  {/* Card header */}
                  <div className="px-5 py-4 border-b border-slate-50 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{survey.cadence.replace("_", " ").toLowerCase()}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{survey.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {questions.length} question{questions.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Users className="w-3.5 h-3.5" />
                        <span style={{ fontFamily: "'DM Mono', monospace" }}>
                          {survey._count.responses}
                        </span>
                        <span>responses</span>
                      </div>
                      {survey.endsAt && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            Ends{" "}
                            {new Date(survey.endsAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                      {isAdmin && (
                        <Link
                          href={`/surveys/${survey.id}/results`}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg transition-all hover:bg-violet-50 text-violet-600"
                        >
                          View results →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Response area for employees/managers */}
                  {!isAdmin && (
                    <div className="px-5 py-5" style={{ background: "#111118" }}>
                      <PulseResponseForm survey={survey} deptId={deptId} />
                    </div>
                  )}

                  {/* Preview for admins */}
                  {isAdmin && (
                    <div className="px-5 py-4 bg-slate-50/50 space-y-2">
                      {questions.map((q, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              background: q.type === "rating" ? "#ede9fe" : "#f1f5f9",
                              color: q.type === "rating" ? "#7c3aed" : "#64748b",
                            }}
                          >
                            {q.type === "rating" ? "1–10" : "Text"}
                          </span>
                          {q.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
