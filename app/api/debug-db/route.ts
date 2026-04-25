import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const res = await pool.query("SELECT email, role FROM \"User\" LIMIT 5")
    await pool.end()
    return NextResponse.json({ ok: true, rows: res.rows })
  } catch (e) {
    await pool.end().catch(() => {})
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
