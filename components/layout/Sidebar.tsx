"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  MessageCircle,
  BarChart3,
  Calendar,
  Activity,
  LogOut,
  Menu,
  X,
  BarChart2,
  Star,
} from "lucide-react"
import { useState } from "react"
import type { Role } from "@/lib/rbac"
import { ROLE_LABELS } from "@/lib/rbac"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Employees",
    href: "/employees",
    icon: Users,
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  },
  {
    label: "Recruitment",
    href: "/recruitment",
    icon: Briefcase,
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  },
  {
    label: "Leave",
    href: "/leave",
    icon: Calendar,
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "PolicyBot",
    href: "/policybot",
    icon: MessageCircle,
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Pulse Surveys",
    href: "/surveys",
    icon: BarChart2,
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Reviews",
    href: "/reviews",
    icon: Star,
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "HR_ADMIN"],
  },
  {
    label: "AgentOps",
    href: "/admin/agentops",
    icon: Activity,
    roles: ["SUPER_ADMIN"],
  },
]

interface SidebarProps {
  role: Role
  name: string
  email: string
  companyName?: string
}

export function Sidebar({ role, name, email, companyName }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="h-16 flex items-center px-5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#4f6ef7", boxShadow: "0 4px 12px rgba(79,110,247,0.35)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" fillOpacity="0.95" />
              <path d="M12 2v20M3 7l9 5 9-5" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
            </svg>
          </div>
          <div>
            <span
              className="block text-[15px] font-bold tracking-tight text-white leading-none"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              HireFlow
              <span style={{ color: "#4f6ef7" }}>.</span>
            </span>
            {companyName && (
              <span
                className="block text-[10px] font-medium mt-0.5 truncate max-w-[130px]"
                style={{ color: "#55556a" }}
              >
                {companyName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p
          className="text-[9px] font-bold uppercase tracking-widest px-2 mb-2"
          style={{ color: "#55556a" }}
        >
          Navigation
        </p>
        {visibleItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="group relative flex items-center gap-3 h-9 px-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={
                active
                  ? {
                      background: "rgba(255,255,255,0.08)",
                      color: "#f1f1f3",
                    }
                  : {
                      color: "#8b8b9e",
                    }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)"
                  e.currentTarget.style.color = "#f1f1f3"
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "#8b8b9e"
                }
              }}
            >
              {/* Active indicator */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background: "#4f6ef7" }}
                />
              )}
              <Icon
                className="w-4 h-4 shrink-0 transition-colors"
                style={{ color: active ? "#4f6ef7" : undefined }}
              />
              <span className="truncate">{item.label}</span>
              {active && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: "#4f6ef7" }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "rgba(79,110,247,0.2)",
              border: "1px solid rgba(79,110,247,0.3)",
            }}
          >
            <span
              className="text-xs font-bold"
              style={{ fontFamily: "'Sora', sans-serif", color: "#4f6ef7" }}
            >
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "#f1f1f3" }}>
              {name}
            </p>
            <span
              className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                background: "rgba(79,110,247,0.15)",
                color: "#4f6ef7",
              }}
            >
              {ROLE_LABELS[role]}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{ color: "#55556a" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444"
              e.currentTarget.style.background = "rgba(239,68,68,0.1)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#55556a"
              e.currentTarget.style.background = "transparent"
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-lg flex items-center justify-center shadow-md transition-all duration-200"
        style={{
          background: "#111118",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#8b8b9e",
        }}
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-60
          transform transition-transform duration-200 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          background: "#0d0d14",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{ color: "#55556a" }}
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 fixed inset-y-0 left-0 z-30"
        style={{
          background: "#0d0d14",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
