"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BiasReport } from "@/components/recruitment/BiasReport"
import { toast } from "sonner"
import { ArrowLeftIcon, SparklesIcon, SaveIcon, LoaderIcon } from "lucide-react"
import Link from "next/link"

interface ParsedJD {
  title: string
  mustHaveSkills: string[]
  niceToHaveSkills: string[]
  experienceYears: number
  biasFlags: { phrase: string; suggestion: string }[]
}

interface BiasData {
  flags: { phrase: string; type: string; suggestion: string }[]
  overallRisk: "LOW" | "MEDIUM" | "HIGH"
}

export default function NewJobPage() {
  const router = useRouter()
  const [jdText, setJdText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parsed, setParsed] = useState<ParsedJD | null>(null)
  const [biasData, setBiasData] = useState<BiasData | null>(null)
  const [editedTitle, setEditedTitle] = useState("")

  const handleAnalyze = async () => {
    if (!jdText.trim()) {
      toast.error("Please enter a job description first")
      return
    }
    setParsing(true)
    try {
      // Parse JD + scan bias in parallel
      const [parseRes, biasRes] = await Promise.all([
        fetch("/api/recruitment/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: jdText, parseWithAI: true }),
        }),
        fetch("/api/recruitment/bias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jdText }),
        }),
      ])

      if (!parseRes.ok) {
        const err = await parseRes.json()
        throw new Error(err.error || "Failed to parse job description")
      }

      const parseData = await parseRes.json()

      // If the job was already created (parseWithAI), redirect to it
      if (parseData.job?.id) {
        if (biasRes.ok) {
          const biasJson = await biasRes.json()
          // Job was created, go to it
          toast.success("Job created and analyzed!")
          router.push(`/recruitment/${parseData.job.id}`)
          return
        }
        toast.success("Job created!")
        router.push(`/recruitment/${parseData.job.id}`)
        return
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setParsing(false)
    }
  }

  const handleAnalyzeOnly = async () => {
    if (!jdText.trim()) {
      toast.error("Please enter a job description first")
      return
    }
    setParsing(true)
    try {
      const [biasRes] = await Promise.all([
        fetch("/api/recruitment/bias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jdText }),
        }),
      ])

      // Simple client-side parse simulation — just extract basic info
      const lines = jdText.split("\n").filter((l) => l.trim())
      const titleLine = lines[0] || "Untitled Position"

      const mockParsed: ParsedJD = {
        title: titleLine.replace(/^(job title:|position:|role:)/i, "").trim(),
        mustHaveSkills: [],
        niceToHaveSkills: [],
        experienceYears: 0,
        biasFlags: [],
      }
      setParsed(mockParsed)
      setEditedTitle(mockParsed.title)

      if (biasRes.ok) {
        const biasJson = await biasRes.json()
        setBiasData(biasJson)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setParsing(false)
    }
  }

  const handleSave = async () => {
    if (!jdText.trim()) {
      toast.error("Job description is required")
      return
    }
    if (!editedTitle.trim()) {
      toast.error("Job title is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/recruitment/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          description: jdText,
          requirements: parsed
            ? [
                ...parsed.mustHaveSkills,
                ...parsed.niceToHaveSkills.map((s) => `[Nice-to-have] ${s}`),
              ]
            : [],
          parseWithAI: !parsed, // Only parse if not already done
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create job")
      }
      const data = await res.json()
      toast.success("Job created successfully!")
      router.push(`/recruitment/${data.job.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleQuickCreate = async () => {
    if (!jdText.trim()) {
      toast.error("Job description is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/recruitment/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: jdText,
          parseWithAI: true,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create job")
      }
      const data = await res.json()
      toast.success("Job created and AI-analyzed!")
      router.push(`/recruitment/${data.job.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/recruitment"
          className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
        >
          <ArrowLeftIcon className="size-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Create New Job</h1>
          <p className="text-sm text-slate-500">AI will parse, structure, and bias-check your JD</p>
        </div>
      </div>

      {/* JD Input */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Job Description
        </label>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste your full job description here. Include title, responsibilities, requirements, and any other relevant information..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          rows={12}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            onClick={handleAnalyzeOnly}
            disabled={parsing || saving}
            variant="outline"
            className="gap-1.5"
          >
            {parsing ? (
              <LoaderIcon className="size-4 animate-spin" />
            ) : (
              <SparklesIcon className="size-4" />
            )}
            Analyze Bias Only
          </Button>
          <Button
            onClick={handleQuickCreate}
            disabled={parsing || saving}
            className="gap-1.5"
          >
            {saving ? (
              <LoaderIcon className="size-4 animate-spin" />
            ) : (
              <SparklesIcon className="size-4" />
            )}
            AI Parse &amp; Create
          </Button>
        </div>
      </div>

      {/* Bias Report */}
      {biasData && (
        <BiasReport flags={biasData.flags} overallRisk={biasData.overallRisk} />
      )}

      {/* Parsed Preview (if analyzing without creating) */}
      {parsed && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-slate-800">Review &amp; Edit</h2>

          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wide">
              Job Title
            </label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Must-have skills */}
          {parsed.mustHaveSkills.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                Required Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.mustHaveSkills.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Nice-to-have skills */}
          {parsed.niceToHaveSkills.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                Nice-to-Have Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.niceToHaveSkills.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {parsed.experienceYears > 0 && (
            <p className="text-sm text-slate-600">
              <span className="font-medium">Experience Required:</span>{" "}
              {parsed.experienceYears}+ years
            </p>
          )}

          {/* Save button */}
          <Button onClick={handleSave} disabled={saving} className="w-full gap-1.5">
            {saving ? (
              <LoaderIcon className="size-4 animate-spin" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            Save &amp; Create Job
          </Button>
        </div>
      )}

      {/* If no analysis done yet, show simple save */}
      {!parsed && !biasData && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500 mb-4">
            Or create the job manually without AI analysis:
          </p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 uppercase tracking-wide">
                Job Title (required if skipping AI)
              </label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="outline"
              className="gap-1.5"
            >
              {saving ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : (
                <SaveIcon className="size-4" />
              )}
              Save Without AI
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
