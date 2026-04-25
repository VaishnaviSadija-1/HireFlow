import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { role, companyId, employeeId } = session.user as {
    role: string
    companyId: string
    employeeId: string
  }

  const { searchParams } = new URL(req.url)
  const queryEmployeeId = searchParams.get("employeeId")

  // HR_ADMIN/SUPER_ADMIN can query any employee's balance via ?employeeId=
  let targetEmployeeId = employeeId
  if (queryEmployeeId && (role === "HR_ADMIN" || role === "SUPER_ADMIN")) {
    targetEmployeeId = queryEmployeeId
  }

  try {
    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId: targetEmployeeId },
    })

    return NextResponse.json(balances)
  } catch (err) {
    console.error("[GET /api/leave/balance]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
