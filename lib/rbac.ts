export type Role = "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE"

export const PERMISSIONS = {
  SUPER_ADMIN: ["*"],
  HR_ADMIN: [
    "employees:read", "employees:write",
    "recruitment:read", "recruitment:write",
    "policybot:read", "policybot:write",
    "analytics:read",
    "leave:read", "leave:write",
    "audit:read",
    "tickets:read", "tickets:write",
    "surveys:read", "surveys:write",
    "reviews:read", "reviews:write",
  ],
  MANAGER: [
    "employees:read",
    "recruitment:read",
    "policybot:read",
    "analytics:team",
    "leave:read", "leave:approve",
    "tickets:read",
    "surveys:read",
    "reviews:read", "reviews:write",
  ],
  EMPLOYEE: [
    "employees:self",
    "policybot:read",
    "leave:self",
    "tickets:self",
    "surveys:respond",
    "reviews:self",
  ],
} as const

export function hasPermission(role: Role, permission: string): boolean {
  const perms = PERMISSIONS[role] as readonly string[]
  return perms.includes("*") || perms.includes(permission)
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  HR_ADMIN: "HR Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
}

export const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800",
  HR_ADMIN: "bg-blue-100 text-blue-800",
  MANAGER: "bg-green-100 text-green-800",
  EMPLOYEE: "bg-gray-100 text-gray-800",
}
