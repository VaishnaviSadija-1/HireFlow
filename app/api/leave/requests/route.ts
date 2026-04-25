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

  try {
    let requests

    if (role === "EMPLOYEE") {
      requests = await prisma.leaveRequest.findMany({
        where: { employeeId, companyId },
        include: { employee: { select: { name: true, title: true } } },
        orderBy: { createdAt: "desc" },
      })
    } else if (role === "MANAGER") {
      // Find all employees whose managerId matches this user's employeeId
      const teamEmployees = await prisma.employee.findMany({
        where: { managerId: employeeId, companyId },
        select: { id: true },
      })
      const teamIds = teamEmployees.map((e) => e.id)
      requests = await prisma.leaveRequest.findMany({
        where: { employeeId: { in: teamIds }, companyId },
        include: { employee: { select: { name: true, title: true } } },
        orderBy: { createdAt: "desc" },
      })
    } else if (role === "HR_ADMIN" || role === "SUPER_ADMIN") {
      requests = await prisma.leaveRequest.findMany({
        where: { companyId },
        include: { employee: { select: { name: true, title: true } } },
        orderBy: { createdAt: "desc" },
      })
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(requests)
  } catch (err) {
    console.error("[GET /api/leave/requests]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { role, companyId, employeeId, id: userId } = session.user as {
    role: string
    companyId: string
    employeeId: string
    id: string
  }

  if (role !== "EMPLOYEE") {
    return NextResponse.json(
      { error: "Only employees can submit leave requests" },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const { type, startDate, endDate, reason } = body

    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "type, startDate and endDate are required" },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (start < today) {
      return NextResponse.json(
        { error: "Leave requests cannot be submitted for past dates" },
        { status: 400 }
      )
    }

    if (start > end) {
      return NextResponse.json(
        { error: "startDate must be on or before endDate" },
        { status: 400 }
      )
    }

    // Check for overlapping APPROVED or PENDING requests
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ["APPROVED", "PENDING"] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    })

    if (overlap) {
      const msg =
        overlap.status === "APPROVED"
          ? "You already have an approved leave overlapping these dates"
          : "You already have a pending leave request overlapping these dates"
      return NextResponse.json({ error: msg }, { status: 409 })
    }

    // Check leave balance
    const days = workingDays(start, end)
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId, type },
    })
    const remaining = (balance?.total ?? 0) - (balance?.used ?? 0)
    if (days > remaining) {
      return NextResponse.json(
        {
          error: `Insufficient leave balance. You have ${remaining} day${remaining !== 1 ? "s" : ""} remaining for ${type.toLowerCase()} leave.`,
        },
        { status: 400 }
      )
    }

    // Get the employee's manager for the managerId field
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { managerId: true },
    })

    const request = await prisma.leaveRequest.create({
      data: {
        employeeId,
        type,
        startDate: start,
        endDate: end,
        reason: reason ?? null,
        status: "PENDING",
        managerId: employee?.managerId ?? null,
        companyId,
      },
    })

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "LEAVE_REQUESTED",
          entity: "LeaveRequest",
          entityId: request.id,
          companyId,
          diff: JSON.stringify({ type, startDate, endDate, reason }),
        },
      })
    } catch (auditErr) {
      console.error("[AuditLog create failed]", auditErr)
    }

    return NextResponse.json(request, { status: 201 })
  } catch (err) {
    console.error("[POST /api/leave/requests]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
