import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { companyId } = session.user as { companyId: string }

  try {
    const departments = await prisma.department.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(departments)
  } catch (err) {
    console.error("[GET /api/departments]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
