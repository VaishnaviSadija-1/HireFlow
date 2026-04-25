import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Update policy document content: replace all "Acme Corp" variants with "Nexus Technologies"
  const docs = await prisma.policyDocument.findMany()
  console.log(`Found ${docs.length} policy documents`)

  let updated = 0
  for (const doc of docs) {
    const newContent = doc.content
      .replace(/Acme Corp(?:'s)?/g, "Nexus Technologies")
      .replace(/Acme Corporation/g, "Nexus Technologies")
      .replace(/acme\.com/g, "nexus.tech")

    if (newContent !== doc.content) {
      await prisma.policyDocument.update({
        where: { id: doc.id },
        data: { content: newContent },
      })
      console.log(`  ✓ Updated "${doc.filename}"`)
      updated++
    } else {
      console.log(`  — "${doc.filename}" (no changes needed)`)
    }
  }

  console.log(`\n✅ Updated ${updated}/${docs.length} policy documents.`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
