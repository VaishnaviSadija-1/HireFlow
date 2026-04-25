import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const company = await prisma.company.findFirst({ where: { domain: "acme.com" } })
  if (!company) throw new Error("Acme Corp not found")

  const dept = await prisma.department.findFirst({
    where: { name: "Engineering", companyId: company.id },
  })

  const manager = await prisma.employee.findFirst({
    where: { name: "Sarah Chen", companyId: company.id },
  })

  const employee = await prisma.employee.create({
    data: {
      name: "Sample Employee",
      email: "sample@acme.com",
      title: "Software Engineer",
      departmentId: dept?.id ?? null,
      managerId: manager?.id ?? null,
      companyId: company.id,
      location: "Bangalore",
      skills: JSON.stringify(["React", "TypeScript", "Node.js"]),
      hireDate: new Date("2025-01-15"),
      gender: "Prefer not to say",
      status: "ACTIVE",
    },
  })

  await prisma.leaveBalance.createMany({
    data: [
      { employeeId: employee.id, type: "SICK",    total: 12, used: 0, companyId: company.id },
      { employeeId: employee.id, type: "CASUAL",  total: 6,  used: 0, companyId: company.id },
      { employeeId: employee.id, type: "ANNUAL",  total: 18, used: 0, companyId: company.id },
    ],
  })

  console.log(`✓ Created: ${employee.name} (${employee.email}) — ID: ${employee.id}`)
  await prisma.$disconnect()
}

main().catch((err) => { console.error(err); process.exit(1) })
