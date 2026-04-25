"use client"

import { useSession } from "next-auth/react"
import type { Role } from "@/lib/rbac"

interface RoleGateProps {
  roles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { data: session } = useSession()
  const userRole = session?.user?.role as Role | undefined

  if (!userRole || !roles.includes(userRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
