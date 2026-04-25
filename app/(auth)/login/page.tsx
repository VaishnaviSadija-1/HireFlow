"use client"

import { useState, useTransition } from "react"
import { signIn } from "next-auth/react"

const QUICK_LOGINS = [
  {
    label: "Super Admin",
    email: "admin@hireflow.dev",
    role: "Platform Owner",
    dotColor: "#a78bfa",
    dotBg: "rgba(167,139,250,0.15)",
  },
  {
    label: "HR Admin",
    email: "hr@nexus.tech",
    role: "HR Manager · Lisa Park",
    dotColor: "#4f6ef7",
    dotBg: "rgba(79,110,247,0.15)",
  },
  {
    label: "Manager",
    email: "manager@nexus.tech",
    role: "Team Lead · Sarah Chen",
    dotColor: "#22c55e",
    dotBg: "rgba(34,197,94,0.15)",
  },
  {
    label: "Employee",
    email: "emp@nexus.tech",
    role: "IC · Alex Rivera",
    dotColor: "#f59e0b",
    dotBg: "rgba(245,158,11,0.15)",
  },
  {
    label: "Employee",
    email: "priya.sharma@nexus.tech",
    role: "IC · Priya Sharma",
    dotColor: "#f59e0b",
    dotBg: "rgba(245,158,11,0.15)",
  },
  {
    label: "Employee",
    email: "marcus.johnson@nexus.tech",
    role: "IC · Marcus Johnson",
    dotColor: "#f59e0b",
    dotBg: "rgba(245,158,11,0.15)",
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [isPending, startTransition] = useTransition()
  const [activeEmail, setActiveEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleQuickLogin(quickEmail: string) {
    setEmail(quickEmail)
    setActiveEmail(quickEmail)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: email.trim(),
        redirect: false,
      })
      if (result?.error) {
        setError(
          result.error === "DB_ERROR"
            ? "Unable to reach the database. Please try again."
            : "No account found with that email address."
        )
        setActiveEmail(null)
      } else {
        window.location.href = "/"
      }
    })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#0a0a0f" }}
    >
      {/* Background mesh glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 800px 600px at 15% 15%, rgba(79,110,247,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 600px 500px at 85% 80%, rgba(167,139,250,0.05) 0%, transparent 70%)
          `,
        }}
      />
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "#4f6ef7",
                boxShadow: "0 4px 16px rgba(79,110,247,0.4)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" fillOpacity="0.95" />
                <path d="M12 2v20M3 7l9 5 9-5" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
              </svg>
            </div>
            <span
              className="text-2xl font-bold tracking-tight text-white"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              HireFlow
              <span style={{ color: "#4f6ef7" }}>.</span>
            </span>
          </div>
          <p
            className="text-sm font-medium uppercase tracking-widest"
            style={{ color: "#55556a" }}
          >
            AI-Native HRMS
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#111118",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          }}
        >
          {/* Card header */}
          <div
            className="px-8 pt-8 pb-6"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <h1
              className="text-xl font-semibold text-white mb-1"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Sign in to your workspace
            </h1>
            <p className="text-sm" style={{ color: "#8b8b9e" }}>
              Enter your work email to continue
            </p>
          </div>

          <div className="px-8 py-6">
            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "#8b8b9e" }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setActiveEmail(null)
                    setError(null)
                  }}
                  placeholder="you@company.com"
                  className="w-full h-10 px-3.5 rounded-lg text-sm text-white transition-all"
                  style={{
                    background: "#16161f",
                    border: "1px solid rgba(255,255,255,0.1)",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(79,110,247,0.5)"
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.1)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                  autoComplete="email"
                  required
                />
                {error && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending || !email.trim()}
                className="w-full h-10 rounded-lg text-white text-sm font-semibold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "#4f6ef7",
                  boxShadow: "0 4px 14px rgba(79,110,247,0.35)",
                }}
                onMouseEnter={(e) => {
                  if (!isPending && email.trim()) {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(79,110,247,0.5)"
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(79,110,247,0.35)"
                }}
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  "Continue with Email"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
              <span className="text-xs font-medium" style={{ color: "#55556a" }}>
                Quick demo access
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            </div>

            {/* Quick login buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              {QUICK_LOGINS.map((ql) => (
                <button
                  key={ql.email}
                  type="button"
                  onClick={() => handleQuickLogin(ql.email)}
                  disabled={isPending}
                  className="relative flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl text-left disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  style={{
                    background: activeEmail === ql.email ? ql.dotBg : "rgba(255,255,255,0.03)",
                    border: activeEmail === ql.email
                      ? `1px solid rgba(79,110,247,0.4)`
                      : "1px solid rgba(255,255,255,0.07)",
                  }}
                  onMouseEnter={(e) => {
                    if (activeEmail !== ql.email) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,110,247,0.3)"
                      ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeEmail !== ql.email) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)"
                      ;(e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: ql.dotColor }}
                    />
                    <span className="text-xs font-semibold" style={{ color: "#f1f1f3" }}>
                      {ql.label}
                    </span>
                  </div>
                  <span className="text-[10px] pl-3" style={{ color: "#55556a" }}>
                    {ql.role}
                  </span>
                </button>
              ))}
            </div>

            {activeEmail && (
              <div
                className="mt-4 flex items-center justify-between rounded-lg px-3 py-2"
                style={{
                  background: "rgba(79,110,247,0.08)",
                  border: "1px solid rgba(79,110,247,0.2)",
                }}
              >
                <span className="text-xs font-medium truncate" style={{ color: "#4f6ef7" }}>
                  {activeEmail}
                </span>
                <button
                  onClick={() => {
                    if (!email.trim()) return
                    setError(null)
                    startTransition(async () => {
                      const result = await signIn("credentials", {
                        email: email.trim(),
                        redirect: false,
                      })
                      if (result?.error) {
                        setError(
                          result.error === "DB_ERROR"
                            ? "Unable to reach the database. Please try again."
                            : "No account found with that email address."
                        )
                        setActiveEmail(null)
                      } else {
                        window.location.href = "/"
                      }
                    })
                  }}
                  disabled={isPending}
                  className="ml-2 shrink-0 text-xs font-semibold disabled:opacity-50 transition-colors"
                  style={{ color: "#4f6ef7" }}
                >
                  Sign in →
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#55556a" }}>
          Demo environment — no password required
        </p>
      </div>

      {/* Font import */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
    </div>
  )
}
