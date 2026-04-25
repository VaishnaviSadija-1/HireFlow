import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { scanBias } from "@/lib/ai/recruitment"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { jdText } = body

  if (!jdText || typeof jdText !== "string") {
    return NextResponse.json({ error: "jdText is required" }, { status: 400 })
  }

  try {
    const report = await scanBias(jdText)
    return NextResponse.json(report)
  } catch (err) {
    console.error("Bias scan error:", err)
    return NextResponse.json(
      { error: "Failed to scan for bias" },
      { status: 500 }
    )
  }
}
