import { anthropic } from "./client"
import { observedAiCall } from "@/lib/agentops/observe"

const SYSTEM_PROMPT = `You are an HR analytics assistant. You will receive anonymous free-text comments from an employee pulse survey. Extract the top recurring themes or keywords that represent what employees are talking about.

Rules:
- Output ONLY a JSON array of objects with "theme" and "count" fields
- Maximum 5 themes
- Themes should be concise (2-4 words max)
- Count represents approximate number of mentions
- Focus on actionable or meaningful patterns
- Ignore filler words and pleasantries
- Example output: [{"theme":"workload concerns","count":8},{"theme":"unclear priorities","count":5},{"theme":"positive team morale","count":4}]`

export async function extractPulseKeywords(
  comments: string[],
  companyId: string
): Promise<{ theme: string; count: number }[]> {
  const filtered = comments.filter((c) => c.trim().length > 0)
  if (filtered.length === 0) return []

  const commentText = filtered.map((c, i) => `${i + 1}. "${c}"`).join("\n")

  try {
    const response = await observedAiCall({
      agentName: "pulse-keyword-extractor",
      companyId,
      fn: () =>
        anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 256,
          system: [
            {
              type: "text",
              text: SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [
            {
              role: "user",
              content: `Extract themes from these ${filtered.length} anonymous pulse survey comments:\n\n${commentText}\n\nReturn only the JSON array.`,
            },
          ],
        }),
    })

    const textBlock = response.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") return []

    const text = textBlock.text.trim()
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    return JSON.parse(jsonMatch[0]) as { theme: string; count: number }[]
  } catch {
    return []
  }
}
