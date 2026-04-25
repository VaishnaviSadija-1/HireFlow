"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import { toast } from "sonner"

interface Message {
  id: string
  role: "user" | "bot"
  text: string
  sources?: string[]
  escalated?: boolean
  escalationReason?: string
  confidence?: "HIGH" | "MEDIUM" | "LOW"
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="#1e40af" fillOpacity="0.8" />
        </svg>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  )
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />')
}

function BotMessage({ msg }: { msg: Message }) {
  return (
    <div className="flex items-end gap-2 max-w-[85%]">
      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="#1e40af" fillOpacity="0.8" />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
          <p
            className="text-sm text-slate-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
          />
          {msg.sources && msg.sources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {msg.sources.map((src) => (
                <span
                  key={src}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
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
                  {src}
                </span>
              ))}
            </div>
          )}
        </div>
        {msg.escalated && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              className="text-amber-500 shrink-0 mt-0.5"
            >
              <path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                fill="currentColor"
                fillOpacity="0.15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="12"
                y1="9"
                x2="12"
                y2="13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="17"
                x2="12.01"
                y2="17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <div>
              <p className="text-xs font-semibold text-amber-700">
                This question has been escalated to HR
              </p>
              {msg.escalationReason && (
                <p className="text-xs text-amber-600 mt-0.5">{msg.escalationReason}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function UserMessage({ msg }: { msg: Message }) {
  return (
    <div className="flex justify-end">
      <div className="bg-[#1e40af] text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%] shadow-sm shadow-blue-500/20">
        <p className="text-sm leading-relaxed">{msg.text}</p>
      </div>
    </div>
  )
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi! I'm HireFlow's HR Policy Assistant. Ask me anything about company policies — leave, benefits, code of conduct, and more. I'll answer based on your company's uploaded policy documents.",
    },
  ])
  const [input, setInput] = useState("")
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isPending])

  function handleSend() {
    const question = input.trim()
    if (!question || isPending) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: question,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")

    startTransition(async () => {
      try {
        const res = await fetch("/api/policybot/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error ?? "Request failed")
        }

        const data = await res.json() as {
          answer: string
          sources?: string[]
          confidence?: "HIGH" | "MEDIUM" | "LOW"
          shouldEscalate?: boolean
          escalationReason?: string
        }

        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: data.answer,
          sources: data.sources ?? [],
          escalated: data.shouldEscalate ?? false,
          escalationReason: data.escalationReason,
          confidence: data.confidence,
        }
        setMessages((prev) => [...prev, botMsg])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to get answer")
        // Remove the user message that failed
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
        setInput(question)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1e40af] flex items-center justify-center shadow-sm shadow-blue-500/30">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" fillOpacity="0.9" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">PolicyBot</h2>
          <p className="text-xs text-slate-500">HR Policy Assistant</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-slate-500">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserMessage key={msg.id} msg={msg} />
          ) : (
            <BotMessage key={msg.id} msg={msg} />
          )
        )}
        {isPending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-slate-200">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about leave policy, benefits, code of conduct…"
            rows={1}
            disabled={isPending}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1e40af] focus:ring-2 focus:ring-[#1e40af]/10 focus:bg-white transition-all disabled:opacity-50 min-h-[40px] max-h-32"
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = "auto"
              target.style.height = Math.min(target.scrollHeight, 128) + "px"
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isPending}
            className="h-10 w-10 rounded-xl bg-[#1e40af] text-white flex items-center justify-center hover:bg-[#1d3a9e] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-500/20 shrink-0"
          >
            {isPending ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
