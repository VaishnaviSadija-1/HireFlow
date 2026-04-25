"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { CandidateCard } from "@/components/recruitment/CandidateCard"
import { CandidateDrawer } from "@/components/recruitment/CandidateDrawer"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  ArrowLeftIcon,
  PlusIcon,
  LoaderIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  UploadIcon,
  FileTextIcon,
} from "lucide-react"
import Link from "next/link"

interface Candidate {
  id: string
  name: string
  email: string
  resumeText: string
  aiScore: number | null
  aiExplanation: string | null
  stage: string
  createdAt: string
}

interface Job {
  id: string
  title: string
  description: string
  requirements: string[]
  status: string
  createdAt: string
}

const KANBAN_STAGES = ["APPLIED", "SCREENED", "INTERVIEW", "OFFER", "HIRED"]

const STAGE_COLORS: Record<string, string> = {
  APPLIED: "bg-slate-100 text-slate-600",
  SCREENED: "bg-blue-100 text-blue-700",
  INTERVIEW: "bg-violet-100 text-violet-700",
  OFFER: "bg-amber-100 text-amber-700",
  HIRED: "bg-emerald-100 text-emerald-700",
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-emerald-100 text-emerald-700" },
  CLOSED: { label: "Closed", className: "bg-gray-100 text-gray-600" },
  DRAFT: { label: "Draft", className: "bg-amber-100 text-amber-700" },
}

interface AddCandidateFormProps {
  jobId: string
  onAdded: (candidate: Candidate) => void
  onClose: () => void
}

function PasteTextForm({ jobId, onAdded, onClose }: AddCandidateFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !resumeText.trim()) {
      toast.error("All fields are required")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/recruitment/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, name, email, resumeText }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to add candidate")
      }
      const data = await res.json()
      onAdded(data.candidate)
      toast.success(`${name} added and AI-scored!`)
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add candidate")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Resume Text
        </label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste the candidate's resume text here. AI will automatically score it against the job requirements."
          rows={10}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          required
        />
        <p className="mt-1 text-xs text-slate-400">
          AI will score this resume against job requirements automatically.
        </p>
      </div>
      <Button type="submit" disabled={loading} className="w-full gap-1.5">
        {loading ? (
          <>
            <LoaderIcon className="size-4 animate-spin" />
            Scoring with AI...
          </>
        ) : (
          <>
            <PlusIcon className="size-4" />
            Add &amp; Score Candidate
          </>
        )}
      </Button>
    </form>
  )
}

function UploadPdfForm({ jobId, onAdded, onClose }: AddCandidateFormProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !file) {
      toast.error("All fields are required")
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("resume", file)
      formData.append("jobId", jobId)
      formData.append("name", name.trim())
      formData.append("email", email.trim())

      const res = await fetch("/api/recruitment/candidates/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to upload resume")
      }
      const data = await res.json()
      onAdded(data.candidate)
      toast.success("Candidate added, AI scoring in progress...")
      onClose()
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload resume")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Resume PDF
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center transition-colors hover:border-blue-300 hover:bg-blue-50"
        >
          {file ? (
            <>
              <FileTextIcon className="size-8 text-blue-500" />
              <p className="text-sm font-medium text-slate-700">{file.name}</p>
              <p className="text-xs text-slate-400">
                {(file.size / 1024).toFixed(0)} KB &middot; Click to change
              </p>
            </>
          ) : (
            <>
              <UploadIcon className="size-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">Click to upload PDF</p>
              <p className="text-xs text-slate-400">PDF files only</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <Button type="submit" disabled={loading || !file} className="w-full gap-1.5">
        {loading ? (
          <>
            <LoaderIcon className="size-4 animate-spin" />
            Uploading &amp; Parsing...
          </>
        ) : (
          <>
            <UploadIcon className="size-4" />
            Upload &amp; Add Candidate
          </>
        )}
      </Button>
    </form>
  )
}

function AddCandidateForm({ jobId, onAdded, onClose }: AddCandidateFormProps) {
  return (
    <div className="px-5 py-4">
      <Tabs defaultValue="paste">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="paste" className="flex-1 gap-1.5">
            <FileTextIcon className="size-3.5" />
            Paste Text
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 gap-1.5">
            <UploadIcon className="size-3.5" />
            Upload PDF
          </TabsTrigger>
        </TabsList>
        <TabsContent value="paste">
          <PasteTextForm jobId={jobId} onAdded={onAdded} onClose={onClose} />
        </TabsContent>
        <TabsContent value="upload">
          <UploadPdfForm jobId={jobId} onAdded={onAdded} onClose={onClose} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface JobKanbanProps {
  job: Job
  initialCandidates: Candidate[]
}

export function JobKanban({ job, initialCandidates }: JobKanbanProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates)
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const [jobStatus, setJobStatus] = useState(job.status)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

  const handleCandidateAdded = (candidate: Candidate) => {
    setCandidates((prev) => [candidate, ...prev])
  }

  const handleStageChange = async (candidateId: string, newStage: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: newStage } : c))
    )
    try {
      const res = await fetch(`/api/recruitment/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      })
      if (!res.ok) throw new Error()
      toast.success("Stage updated")
    } catch {
      // Revert on failure — reload from server
      toast.error("Failed to update stage")
    }
  }

  const handleViewDetails = (candidateId: string) => {
    setSelectedCandidateId(candidateId)
    setDrawerOpen(true)
  }

  const handleJobStatusChange = async (newStatus: string) => {
    setStatusChanging(true)
    setStatusDropdownOpen(false)
    try {
      const res = await fetch(`/api/recruitment/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setJobStatus(newStatus)
      toast.success(`Job status updated to ${newStatus}`)
    } catch {
      toast.error("Failed to update job status")
    } finally {
      setStatusChanging(false)
    }
  }

  const statusConfig = STATUS_CONFIG[jobStatus] ?? STATUS_CONFIG.OPEN

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/recruitment"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors mt-0.5"
          >
            <ArrowLeftIcon className="size-4 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="size-5 text-blue-600" />
              <h1 className="text-xl font-semibold text-slate-900">{job.title}</h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Created {new Date(job.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })} &middot; {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status dropdown */}
          <div className="relative">
            <button
              onClick={() => setStatusDropdownOpen((v) => !v)}
              disabled={statusChanging}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${statusConfig.className} hover:opacity-80`}
            >
              {statusConfig.label}
              <ChevronDownIcon className="size-3" />
            </button>
            {statusDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-10 rounded-lg border border-slate-200 bg-white shadow-lg py-1 min-w-[110px]">
                {["OPEN", "DRAFT", "CLOSED"].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleJobStatusChange(s)}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={() => setAddSheetOpen(true)}
            className="gap-1.5"
            size="sm"
          >
            <PlusIcon className="size-4" />
            Add Candidate
          </Button>
        </div>
      </div>

      {/* Requirements chips */}
      {job.requirements.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {job.requirements.slice(0, 8).map((req, i) => {
            const isNiceToHave = req.startsWith("[Nice-to-have]")
            const label = req.replace("[Nice-to-have] ", "")
            return (
              <span
                key={i}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  isNiceToHave
                    ? "bg-slate-100 text-slate-500"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {label}
              </span>
            )
          })}
          {job.requirements.length > 8 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-400">
              +{job.requirements.length - 8} more
            </span>
          )}
        </div>
      )}

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {KANBAN_STAGES.map((stage) => {
          const stageCandidates = candidates.filter((c) => c.stage === stage)
          const stageColor = STAGE_COLORS[stage]

          return (
            <div
              key={stage}
              className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 shrink-0 w-64"
            >
              {/* Column header */}
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stageColor}`}
                >
                  {stage}
                </span>
                <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {stageCandidates.length}
                </span>
              </div>

              {/* Candidate cards */}
              <div className="flex flex-col gap-2 flex-1">
                {stageCandidates.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-8">
                    <p className="text-xs text-slate-400">No candidates</p>
                  </div>
                ) : (
                  stageCandidates.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      onViewDetails={handleViewDetails}
                      onStageChange={handleStageChange}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Candidate Sheet */}
      <Sheet open={addSheetOpen} onOpenChange={(v) => !v && setAddSheetOpen(false)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="border-b border-gray-100 px-5 py-4">
            <SheetTitle>Add Candidate</SheetTitle>
            <SheetDescription>
              Paste resume text or upload a PDF — AI will score it against the job requirements.
            </SheetDescription>
          </SheetHeader>
          <AddCandidateForm
            jobId={job.id}
            onAdded={handleCandidateAdded}
            onClose={() => setAddSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Candidate Detail Drawer */}
      <CandidateDrawer
        candidateId={selectedCandidateId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedCandidateId(null)
        }}
        onStageChange={handleStageChange}
      />
    </div>
  )
}
