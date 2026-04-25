import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function workingDays(start: Date, end: Date): number {
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { role, companyId, employeeId, id: userId, email } = session.user as {
    role: string
    companyId: string
    employeeId: string
    id: string
    email: string
  }

  const { id } = await params

  try {
    const body = await req.json()
    const { status } = body

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "status must be APPROVED or REJECTED" },
        { status: 400 }
      )
    }

    // Fetch the existing request
    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: { select: { managerId: true, name: true } } },
    })

    if (!existing) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 })
    }

    // SUPER_ADMIN has no companyId in session — skip tenant check
    if (role !== "SUPER_ADMIN" && existing.companyId !== companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Authorization check
    const isHRAdmin = role === "HR_ADMIN" || role === "SUPER_ADMIN"
    const isManagerOfEmployee =
      role === "MANAGER" && existing.employee.managerId === employeeId

    if (!isHRAdmin && !isManagerOfEmployee) {
      return NextResponse.json(
        { error: "You are not authorized to update this request" },
        { status: 403 }
      )
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only PENDING requests can be approved or rejected" },
        { status: 409 }
      )
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status },
      include: { employee: { select: { name: true, title: true } } },
    })

    // If approved, increment leave balance used
    if (status === "APPROVED") {
      const days = workingDays(existing.startDate, existing.endDate)
      // Upsert LeaveBalance — increment used days
      const balance = await prisma.leaveBalance.findFirst({
        where: { employeeId: existing.employeeId, type: existing.type },
      })
      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { used: { increment: days } },
        })
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
          entity: "LeaveRequest",
          entityId: id,
          companyId,
          diff: JSON.stringify({ status, by: email }),
        },
      })
    } catch (auditErr) {
      console.error("[AuditLog create failed]", auditErr)
    }

    return NextResponse.json(updated)
  } catch (err) {
    console.error("[PATCH /api/leave/requests/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
