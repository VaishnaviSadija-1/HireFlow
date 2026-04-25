import "next-auth"
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      companyId: string
      employeeId: string
      companyName: string
    }
  }

  interface User {
    role?: string | null
    companyId?: string | null
    employeeId?: string | null
    companyName?: string | null
  }
}
