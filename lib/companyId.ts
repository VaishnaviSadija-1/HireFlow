import { prisma } from "@/lib/prisma"

/**
 * Resolves companyId for any user role, including SUPER_ADMIN who has no
 * company in the DB — falls back to the first available company.
 */
export async function resolveCompanyId(
  sessionUser: { companyId?: string | null }
): Promise<string> {
  if (sessionUser.companyId) return sessionUser.companyId
  const first = await prisma.company.findFirst({ select: { id: true } })
  return first?.id ?? ""
}
