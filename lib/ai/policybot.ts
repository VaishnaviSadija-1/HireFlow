import Anthropic from "@anthropic-ai/sdk"
import { anthropic } from "./client"
import { observedAiCall } from "@/lib/agentops/observe"

export interface PolicyDoc {
  filename: string
  content: string
}

export interface PolicyBotResult {
  answer: string
  sources: string[]
  confidence: "HIGH" | "MEDIUM" | "LOW"
  shouldEscalate: boolean
  escalationReason?: string
}

function extractKeywords(question: string): string[] {
  const stopWords = new Set([
    "what", "is", "are", "the", "a", "an", "how", "do", "does", "can",
    "i", "my", "me", "we", "our", "you", "your", "it", "its", "this",
    "that", "there", "their", "they", "be", "been", "being", "have",
    "has", "had", "will", "would", "could", "should", "may", "might",
    "for", "to", "of", "in", "on", "at", "by", "from", "with", "about",
    "and", "or", "but", "not", "no", "so",
  ])
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
}

function scoreDocRelevance(doc: PolicyDoc, keywords: string[]): number {
  const lower = doc.content.toLowerCase()
  return keywords.reduce((score, kw) => {
    const matches = (lower.match(new RegExp(kw, "g")) || []).length
    return score + matches
  }, 0)
}

export async function answerPolicyQuestion(
  question: string,
  policyDocs: PolicyDoc[]
): Promise<PolicyBotResult> {
  // 1. Handle empty docs case
  if (policyDocs.length === 0) {
    return {
      answer:
        "No policy documents have been uploaded yet. Please contact HR for assistance.",
      sources: [],
      confidence: "LOW",
      shouldEscalate: true,
      escalationReason: "No policy documents found in the system",
    }
  }

  // 2. Keyword-based relevance filtering — pick top 3 docs
  const keywords = extractKeywords(question)
  const scored = policyDocs
    .map((doc) => ({ doc, score: scoreDocRelevance(doc, keywords) }))
    .sort((a, b) => b.score - a.score)

  const topDocs = scored.slice(0, 3).filter((s) => s.score > 0)
  const docsToUse = topDocs.length > 0 ? topDocs.map((s) => s.doc) : policyDocs.slice(0, 3)

  // 3. Build context string (first 2000 chars per doc)
  const contextString = docsToUse
    .map((doc) => `=== Document: ${doc.filename} ===\n${doc.content.slice(0, 2000)}`)
    .join("\n\n")

  // 4. Call Claude with prompt caching on policy context + tool use for structured output
  const response = await observedAiCall({
    agentName: "policybot-rag",
    companyId: undefined,
    fn: () => anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system:
        "You are a concise HR policy assistant. Answer employee questions based ONLY on the provided policy documents.\nRules:\n- Keep answers SHORT: 2-4 sentences max\n- Be direct and specific — state the exact number/rule immediately\n- If the answer is a number or date, lead with it\n- No lengthy preambles or \"Based on the policy...\" openers\n- Cite the source document in one short phrase at the end: (Source: filename)\n- If you cannot find a clear answer, say: \"I don't have that information in the current policies. I'll escalate this to HR.\"",
      tools: [
        {
          name: "policy_answer",
          description:
            "Return a structured answer based on policy documents. Always call this tool with your response.",
          input_schema: {
            type: "object" as const,
            properties: {
              answer: {
                type: "string",
                description: "The answer to the employee's question based on policy documents",
              },
              sources: {
                type: "array",
                items: { type: "string" },
                description: "List of document filenames used to answer the question",
              },
              confidence: {
                type: "string",
                enum: ["HIGH", "MEDIUM", "LOW"],
                description:
                  "HIGH: clear answer found, MEDIUM: partial info found, LOW: no relevant info found",
              },
              shouldEscalate: {
                type: "boolean",
                description: "true if the question cannot be clearly answered from the documents",
              },
              escalationReason: {
                type: "string",
                description: "Reason for escalation if shouldEscalate is true",
              },
            },
            required: ["answer", "sources", "confidence", "shouldEscalate"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "policy_answer" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Here are the relevant HR policy documents for your reference:\n\n${contextString}`,
              // Prompt caching: cache the policy context so repeated questions against the
              // same docs don't re-send all the tokens.
              cache_control: { type: "ephemeral" } satisfies Anthropic.CacheControlEphemeral,
            } satisfies Anthropic.Messages.TextBlockParam,
            {
              type: "text",
              text: `Employee question: ${question}`,
            } satisfies Anthropic.Messages.TextBlockParam,
          ],
        },
      ],
    }),
  })

  // 5. Extract structured tool call result
  const toolUse = response.content.find((block) => block.type === "tool_use")
  if (!toolUse || toolUse.type !== "tool_use") {
    return {
      answer:
        "I was unable to process your question at this time. Please contact HR directly.",
      sources: [],
      confidence: "LOW",
      shouldEscalate: true,
      escalationReason: "AI response parsing error",
    }
  }

  const result = toolUse.input as {
    answer: string
    sources: string[]
    confidence: "HIGH" | "MEDIUM" | "LOW"
    shouldEscalate: boolean
    escalationReason?: string
  }

  return {
    answer: result.answer,
    sources: result.sources ?? [],
    confidence: result.confidence ?? "LOW",
    shouldEscalate: result.shouldEscalate || result.confidence === "LOW",
    escalationReason: result.escalationReason,
  }
}
