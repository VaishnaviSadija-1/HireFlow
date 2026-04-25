import { prisma } from "@/lib/prisma"

interface ObservedCallOptions<T> {
  agentName: string        // e.g. "recruitment-jd-parser", "policybot-rag", "analytics-narrative"
  companyId?: string
  fn: () => Promise<T>    // the actual anthropic.messages.create() call
}

export async function observedAiCall<T>({
  agentName,
  companyId,
  fn,
}: ObservedCallOptions<T>): Promise<T> {
  const start = Date.now()
  let response: T
  let inputTokens = 0
  let outputTokens = 0
  const promptSummary = agentName
  let responseSummary = ""

  try {
    response = await fn()
    const latencyMs = Date.now() - start

    // Extract token counts if response has usage field
    const usage = (response as any)?.usage
    if (usage) {
      inputTokens = usage.input_tokens ?? 0
      outputTokens = usage.output_tokens ?? 0
    }

    // Estimate cost: claude-sonnet-4-6 pricing
    // Input: $3/M tokens, Output: $15/M tokens
    const costUsd = (inputTokens * 3 + outputTokens * 15) / 1_000_000

    // Summarize response for log
    const content = (response as any)?.content
    if (Array.isArray(content)) {
      const textBlock = content.find((b: any) => b.type === "text")
      if (textBlock) responseSummary = textBlock.text?.slice(0, 500) ?? ""
      // For tool_use responses, capture the tool name
      if (!responseSummary) {
        const toolBlock = content.find((b: any) => b.type === "tool_use")
        if (toolBlock) responseSummary = `[tool_use: ${toolBlock.name}]`
      }
    }

    // Fire-and-forget DB write (don't await — don't block the response)
    prisma.aiCallLog
      .create({
        data: {
          agentName,
          prompt: promptSummary,
          response: responseSummary,
          inputTokens,
          outputTokens,
          latencyMs,
          costUsd,
          companyId: companyId ?? null,
        },
      })
      .catch(console.error)

    return response
  } catch (error: any) {
    const latencyMs = Date.now() - start

    // Log failed call too
    prisma.aiCallLog
      .create({
        data: {
          agentName,
          prompt: promptSummary,
          response: `ERROR: ${error?.message ?? "unknown"}`,
          inputTokens: 0,
          outputTokens: 0,
          latencyMs,
          costUsd: 0,
          companyId: companyId ?? null,
        },
      })
      .catch(console.error)

    throw error
  }
}
