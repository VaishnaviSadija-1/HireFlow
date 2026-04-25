import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { answerPolicyQuestion } from "@/lib/ai/policybot"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let { companyId, employeeId } = session.user as {
    companyId?: string
    employeeId?: string
  }

  // Super Admin may have no companyId — fall back to first company
  if (!companyId) {
    const first = await prisma.company.findFirst()
    companyId = first?.id
  }

  if (!companyId) {
    return NextResponse.json({ error: "No company found" }, { status: 400 })
  }

  let body: { question?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const question = body.question?.trim()
  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 })
  }

  // Fetch policy documents for the company
  const policyDocs = await prisma.policyDocument.findMany({
    where: { companyId },
    select: { filename: true, content: true },
  })

  // Run RAG answer
  const result = await answerPolicyQuestion(question, policyDocs)

  // Validate employeeId exists before linking ticket
  let validEmployeeId = employeeId
  if (validEmployeeId) {
    const emp = await prisma.employee.findUnique({ where: { id: validEmployeeId } })
    if (!emp) validEmployeeId = undefined
  }

  // If no valid employee, use first employee in company as fallback for ticket
  if (!validEmployeeId) {
    const fallback = await prisma.employee.findFirst({ where: { companyId } })
    validEmployeeId = fallback?.id
  }

  let ticket = null
  if (validEmployeeId) {
    ticket = await prisma.ticket.create({
      data: {
        employeeId: validEmployeeId,
        companyId,
        question,
        aiAnswer: result.answer,
        escalated: result.shouldEscalate,
        resolved: false,
      },
      include: {
        employee: { select: { name: true, email: true } },
      },
    })
  }

  return NextResponse.json({
    ticket,
    answer: result.answer,
    sources: result.sources,
    confidence: result.confidence,
    shouldEscalate: result.shouldEscalate,
    escalationReason: result.escalationReason,
  })
}
