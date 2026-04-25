"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface PolicyDoc {
  id: string
  filename: string
  uploadedAt: string
}

export default function PolicyUpload() {
  const [filename, setFilename] = useState("")
  const [content, setContent] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docs, setDocs] = useState<PolicyDoc[]>([])
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDocs()
  }, [])

  async function fetchDocs() {
    try {
      const res = await fetch("/api/policybot/upload")
      if (res.ok) {
        const data = await res.json() as { documents: PolicyDoc[] }
        setDocs(data.documents)
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  function handleFileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("file", selectedFile)

        const res = await fetch("/api/policybot/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error ?? "Upload failed")
        }

        const data = await res.json() as { document: PolicyDoc }
        setDocs((prev) => [data.document, ...prev])
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        toast.success(`Policy document "${data.document.filename}" uploaded successfully`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed")
      }
    })
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!filename.trim() || !content.trim()) return

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("filename", filename.trim())
        formData.append("content", content.trim())

        const res = await fetch("/api/policybot/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error ?? "Upload failed")
        }

        const data = await res.json() as { document: PolicyDoc }
        setDocs((prev) => [data.document, ...prev])
        setFilename("")
        setContent("")
        toast.success(`Policy document "${data.document.filename}" uploaded successfully`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed")
      }
    })
  }

  const uploadIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#1e40af]">
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  const spinnerIcon = (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          {uploadIcon}
          Upload Policy Document
        </h3>

        <Tabs defaultValue="file">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="file" className="flex-1">Upload File</TabsTrigger>
            <TabsTrigger value="text" className="flex-1">Paste Text</TabsTrigger>
          </TabsList>

          {/* File Upload Tab */}
          <TabsContent value="file">
            <form onSubmit={handleFileSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Select File (.pdf or .txt)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  required
                  className="w-full text-sm text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1e40af] file:text-white hover:file:bg-[#1d3a9e] file:cursor-pointer cursor-pointer bg-slate-50 border border-slate-200 rounded-lg h-9 flex items-center focus:outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/10 transition-all"
                />
                {selectedFile && (
                  <p className="text-xs text-slate-500 mt-1">
                    Selected: <span className="font-medium text-slate-700">{selectedFile.name}</span>
                    {" "}({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isPending || !selectedFile}
                className="w-full h-9 rounded-lg bg-[#1e40af] text-white text-sm font-semibold hover:bg-[#1d3a9e] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-500/20"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    {spinnerIcon}
                    Uploading…
                  </span>
                ) : (
                  "Upload File"
                )}
              </button>
            </form>
          </TabsContent>

          {/* Paste Text Tab */}
          <TabsContent value="text">
            <form onSubmit={handleTextSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Document Name
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="e.g. Leave Policy 2024.txt"
                  required
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/10 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Policy Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste the full text of your policy document here..."
                  required
                  rows={8}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/10 focus:bg-white transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isPending || !filename.trim() || !content.trim()}
                className="w-full h-9 rounded-lg bg-[#1e40af] text-white text-sm font-semibold hover:bg-[#1d3a9e] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-500/20"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    {spinnerIcon}
                    Uploading…
                  </span>
                ) : (
                  "Upload Document"
                )}
              </button>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      {/* Existing documents */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-500">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="14,2 14,8 20,8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Uploaded Documents ({docs.length})
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No documents uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-slate-400 shrink-0">
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{doc.filename}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
