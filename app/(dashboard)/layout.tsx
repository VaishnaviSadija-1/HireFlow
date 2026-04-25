import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import type { Role } from "@/lib/rbac"
import { ROLE_LABELS } from "@/lib/rbac"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const { name, email, role, companyName } = session.user

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar
        role={role as Role}
        name={name}
        email={email}
        companyName={companyName}
      />

      {/* Main content — offset by sidebar width */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header
          className="h-16 flex items-center gap-4 px-6 lg:px-8 shrink-0 sticky top-0 z-20"
          style={{
            background: "#0d0d14",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Spacer for mobile hamburger */}
          <div className="w-9 lg:hidden" />

          <div className="flex items-center gap-2 min-w-0">
            {companyName && (
              <>
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {companyName}
                </span>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              </>
            )}
          </div>

          <div className="flex-1" />

          {/* Role indicator */}
          <div className="flex items-center gap-3">
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium" style={{ color: "#8b8b9e" }}>
                {ROLE_LABELS[role as Role]}
              </span>
            </div>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(79,110,247,0.2)",
                border: "1px solid rgba(79,110,247,0.3)",
              }}
            >
              <span
                className="text-[11px] font-bold"
                style={{ fontFamily: "'Sora', sans-serif", color: "#4f6ef7" }}
              >
                {name
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
