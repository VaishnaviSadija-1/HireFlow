import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

// Use the lightweight auth config (no DB) for middleware Edge Runtime
export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
