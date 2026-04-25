import { NextResponse } from "next/server"
import { Pool } from "pg"
import dns from "dns/promises"

async function tryConn(url: string): Promise<string> {
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 4000 })
  try {
    await pool.query("SELECT 1")
    await pool.end()
    return "OK"
  } catch (e) {
    try { await pool.end() } catch {}
    return (e as Error).message.slice(0, 100)
  }
}

export async function GET() {
  const REF = "ivuogjfcxibxgnunsabo"
  const PWD = "Anilmann%40101"
  const PWD2 = "Anilmann%4010"

  // DNS test
  let directDns = "?"
  try { directDns = JSON.stringify(await dns.resolve6(`db.${REF}.supabase.co`)) } catch (e) { directDns = String(e) }

  // Test pooler from Vercel's perspective
  const tests: Record<string, string> = {}
  for (const region of ["us-east-1", "ap-southeast-1", "ap-south-1", "eu-west-1"]) {
    for (const [user, pwd] of [
      [`postgres.${REF}`, PWD],
      [`postgres.${REF}`, PWD2],
      ["postgres", PWD],
    ]) {
      const key = `${region}/${user}/${pwd.slice(-4)}`
      tests[key] = await tryConn(`postgresql://${user}:${pwd}@aws-0-${region}.pooler.supabase.com:6543/postgres`)
      if (tests[key] === "OK") break
    }
  }

  return NextResponse.json({ directDns, tests })
}
