import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        let user
        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: { company: true }
          })
        } catch (e) {
          console.error('[auth] DB error during login:', e)
          throw new Error('DB_ERROR')
        }
        if (!user) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          employeeId: user.employeeId,
          companyName: user.company?.name,
        }
      }
    })
  ],
})
