import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const result = await prisma.company.updateMany({
    where: { name: "Acme Corp" },
    data: { name: "Nexus Technologies", domain: "nexus.tech" },
  })
  console.log(`Company name updated. Records affected: ${result.count}`)
  await prisma.$disconnect()
}

main().catch(console.error)
