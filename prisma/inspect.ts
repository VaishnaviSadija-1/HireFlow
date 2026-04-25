import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const emps = await prisma.employee.findMany({
    include: { department: true },
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' },
  })

  emps.forEach(e =>
    console.log(`${e.id} | ${e.name} | ${e.title} | dept:${e.department?.name ?? 'none'} | deptId:${e.departmentId ?? 'none'} | mgr:${e.managerId ?? 'none'}`)
  )

  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, employeeId: true } })
  console.log('\n--- USERS ---')
  users.forEach(u => console.log(`${u.email} | ${u.role} | empId:${u.employeeId ?? 'none'}`))

  await prisma.$disconnect()
}

main()
