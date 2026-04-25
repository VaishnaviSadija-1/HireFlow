import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest) {
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
    let employees

    if (role === "MANAGER") {
      employees = await prisma.employee.findMany({
        where: { managerId: employeeId, companyId },
        include: {
          department: { select: { name: true } },
          manager: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      })
    } else if (role === "SUPER_ADMIN") {
      let resolvedCompanyId = companyId
      if (!resolvedCompanyId) {
        const firstCompany = await prisma.company.findFirst()
        resolvedCompanyId = firstCompany?.id ?? ""
      }
      employees = await prisma.employee.findMany({
        where: { companyId: resolvedCompanyId },
        include: {
          department: { select: { name: true } },
          manager: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      })
    } else {
      // HR_ADMIN and EMPLOYEE
      employees = await prisma.employee.findMany({
        where: { companyId },
        include: {
          department: { select: { name: true } },
          manager: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      })
    }

    return NextResponse.json(employees)
  } catch (err) {
    console.error("[GET /api/employees]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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

  try {
    const body = await req.json()
    const { name, email, title, departmentId, managerId, location, skills, hireDate, gender } = body

    if (!name || !email || !title || !location || !hireDate) {
      return NextResponse.json(
        { error: "name, email, title, location, and hireDate are required" },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        title,
        departmentId: departmentId || null,
        managerId: managerId || null,
        companyId,
        location,
        skills: JSON.stringify(Array.isArray(skills) ? skills : []),
        hireDate: new Date(hireDate),
        status: "ACTIVE",
        gender: gender || null,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "EMPLOYEE_CREATED",
        entity: "Employee",
        entityId: employee.id,
        companyId,
        diff: JSON.stringify({ name, email, title, location, hireDate }),
      },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (err) {
    console.error("[POST /api/employees]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
