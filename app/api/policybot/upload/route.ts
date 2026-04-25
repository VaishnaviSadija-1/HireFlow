import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PDFParse } from "pdf-parse"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { role, companyId } = session.user as { role?: string; companyId?: string }

  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden — HR Admin only" }, { status: 403 })
  }

  if (!companyId) {
    return NextResponse.json({ error: "No company associated with account" }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  // Support both file upload and text paste
  const file = formData.get("file") as File | null
  const textContent = formData.get("content") as string | null
  const filename = (formData.get("filename") as string | null) || file?.name || "policy.txt"

  let content = ""

  if (file) {
    if (file.type === "application/pdf") {
      const buffer = Buffer.from(await file.arrayBuffer())
      const parser = new PDFParse({ data: buffer })
      const pdfData = await parser.getText()
      content = pdfData.text ?? ""
    } else {
      // Plain text file
      content = await file.text()
    }
  } else if (textContent) {
    content = textContent
  } else {
    return NextResponse.json({ error: "No content provided" }, { status: 400 })
  }

  if (!filename.trim()) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 })
  }
  if (!content.trim()) {
    return NextResponse.json({ error: "Policy content is required" }, { status: 400 })
  }

  const doc = await prisma.policyDocument.create({
    data: {
      filename: filename.trim(),
      content: content.trim(),
      companyId,
    },
  })

  return NextResponse.json({ document: doc }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { role, companyId } = session.user as { role?: string; companyId?: string }

  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 })
  }

  const docs = await prisma.policyDocument.findMany({
    where: { companyId },
    select: { id: true, filename: true, uploadedAt: true },
    orderBy: { uploadedAt: "desc" },
  })

  return NextResponse.json({ documents: docs })
}
