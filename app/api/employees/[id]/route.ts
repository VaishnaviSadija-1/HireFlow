import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { companyId } = session.user as { companyId: string }
  const { id } = await params

  try {
    const employee = await prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (err) {
    console.error("[GET /api/employees/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { role, companyId, id: userId } = session.user as {
    role: string
    companyId: string
    id: string
  }

  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const { name, email, title, departmentId, managerId, location, skills, hireDate, gender, status } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (title !== undefined) updateData.title = title
    if (departmentId !== undefined) updateData.departmentId = departmentId || null
    if (managerId !== undefined) updateData.managerId = managerId || null
    if (location !== undefined) updateData.location = location
    if (skills !== undefined) updateData.skills = JSON.stringify(Array.isArray(skills) ? skills : [])
    if (hireDate !== undefined) updateData.hireDate = new Date(hireDate)
    if (gender !== undefined) updateData.gender = gender || null
    if (status !== undefined) updateData.status = status

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "EMPLOYEE_UPDATED",
        entity: "Employee",
        entityId: id,
        companyId,
        diff: JSON.stringify(updateData),
      },
    })

    return NextResponse.json(employee)
  } catch (err) {
    console.error("[PATCH /api/employees/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { role, companyId, id: userId } = session.user as {
    role: string
    companyId: string
    id: string
  }

  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: { status: "INACTIVE" },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "EMPLOYEE_DEACTIVATED",
        entity: "Employee",
        entityId: id,
        companyId,
        diff: JSON.stringify({ status: "INACTIVE" }),
      },
    })

    return NextResponse.json(employee)
  } catch (err) {
    console.error("[DELETE /api/employees/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
