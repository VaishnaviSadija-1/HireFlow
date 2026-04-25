import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const company = await prisma.company.findFirst()
  if (!company) throw new Error("No company found")

  console.log(`Company: ${company.name} (${company.id})`)

  // 1. Update all employee emails @acme.com → @nexus.tech
  const empResult = await prisma.$executeRaw`
    UPDATE "Employee"
    SET email = REPLACE(email, '@acme.com', '@nexus.tech')
    WHERE email LIKE '%@acme.com'
  `
  console.log(`✓ Updated ${empResult} employee emails to @nexus.tech`)

  // 2. Update all user emails @acme.com → @nexus.tech
  const userResult = await prisma.$executeRaw`
    UPDATE "User"
    SET email = REPLACE(email, '@acme.com', '@nexus.tech')
    WHERE email LIKE '%@acme.com'
  `
  console.log(`✓ Updated ${userResult} user accounts to @nexus.tech`)

  // 3. List current users for reference
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, employeeId: true },
  })
  console.log("\nCurrent user accounts:")
  for (const u of users) {
    console.log(`  [${u.role}] ${u.email} — ${u.name}`)
  }

  // 4. Add extra EMPLOYEE demo accounts linked to existing employees (if not already present)
  const existingEmails = new Set(users.map((u) => u.email))

  // Find employees who don't have a user account
  const employees = await prisma.employee.findMany({
    where: {
      companyId: company.id,
      status: "ACTIVE",
    },
    select: { id: true, name: true, email: true },
    take: 10,
  })

  let added = 0
  for (const emp of employees) {
    const empEmail = emp.email.replace("@acme.com", "@nexus.tech")
    if (!existingEmails.has(empEmail)) {
      await prisma.user.create({
        data: {
          email: empEmail,
          name: emp.name,
          role: "EMPLOYEE",
          companyId: company.id,
          employeeId: emp.id,
        },
      })
      console.log(`  ✓ Created user: ${empEmail} [EMPLOYEE]`)
      added++
      if (added >= 3) break // Add up to 3 extra accounts
    }
  }

  if (added === 0) {
    console.log("  (No additional employee accounts needed)")
  }

  console.log("\n✅ Done. Sign in with any of the emails above (no password needed).")
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
