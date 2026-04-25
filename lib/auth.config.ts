import type { NextAuthConfig } from "next-auth"

// This config is used for the middleware (Edge Runtime compatible - no DB access)
export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const path = nextUrl.pathname
      const isApiRoute = path.startsWith("/api/")
      const PUBLIC_PATHS = ["/login", "/api/auth", "/api/debug-db"]
      const isPublic = PUBLIC_PATHS.some(p => path.startsWith(p))

      if (isPublic) return true

      // API routes: return 401 JSON, not a redirect
      if (!isLoggedIn && isApiRoute) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      }

      if (!isLoggedIn) return false

      const role = auth?.user?.role

      // Only super admin can access /admin routes
      if (path.startsWith("/admin") && role !== "SUPER_ADMIN") {
        return Response.redirect(new URL("/", nextUrl))
      }

      // Employees can't access recruitment
      if (path.startsWith("/recruitment") && role === "EMPLOYEE") {
        return Response.redirect(new URL("/", nextUrl))
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.companyId = user.companyId
        token.employeeId = user.employeeId
        token.companyName = user.companyName
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as string
      session.user.companyId = token.companyId as string
      session.user.employeeId = token.employeeId as string
      session.user.companyName = token.companyName as string
      return session
    }
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" }
}
