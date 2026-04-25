import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const p = new PrismaClient({ adapter })

async function main() {
  const [u, e, j, c, pd, lr, lb, t] = await Promise.all([
    p.user.count(),
    p.employee.count(),
    p.job.count(),
    p.candidate.count(),
    p.policyDocument.count(),
    p.leaveRequest.count(),
    p.leaveBalance.count(),
    p.ticket.count(),
  ])
  console.log(JSON.stringify({ u, e, j, c, pd, lr, lb, t }))
  await p.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
