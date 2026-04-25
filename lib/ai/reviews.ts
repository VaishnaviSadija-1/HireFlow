import { anthropic } from "./client"
import { observedAiCall } from "@/lib/agentops/observe"

const SYSTEM_PROMPT = `You are an expert HR performance coach tasked with synthesizing 360-degree performance review feedback into fair, balanced, and actionable summaries.

Guidelines:
- Write in a professional, balanced, and growth-oriented tone
- Be specific — reference actual themes from the feedback, not generic platitudes
- Do not invent information not present in the reviews
- Keep each section concise: 2-3 sentences max
- Output ONLY valid JSON matching this exact structure:
{
  "strengths": "2-3 sentence paragraph about top strengths",
  "growthAreas": "2-3 sentence paragraph about key development areas",
  "narrative": "1 balanced paragraph overall summary (3-4 sentences)"
}`

interface ReviewInput {
  role: "SELF" | "MANAGER"
  answers: Record<string, string>
  overallRating?: number
}

export async function synthesizeReviews(
  revieweeName: string,
  revieweeTitle: string,
  reviews: ReviewInput[],
  companyId: string
): Promise<{ strengths: string; growthAreas: string; narrative: string }> {
  const reviewContext = reviews
    .map((r) => {
      const ratingLine = r.overallRating != null ? `Overall rating: ${r.overallRating}/5\n` : ""
      const answersText = Object.entries(r.answers)
        .map(([q, a]) => `Q: ${q}\nA: ${a}`)
        .join("\n\n")
      return `--- ${r.role} REVIEW ---\n${ratingLine}${answersText}`
    })
    .join("\n\n")

  const response = await observedAiCall({
    agentName: "review-synthesizer",
    companyId,
    fn: () =>
      anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
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
            content: `Synthesize the following performance reviews for ${revieweeName} (${revieweeTitle}):\n\n${reviewContext}\n\nReturn only the JSON object.`,
          },
        ],
      }),
  })

  const textBlock = response.content.find((b) => b.type === "text")
  if (!textBlock || textBlock.type !== "text") {
    return {
      strengths: "Unable to generate synthesis at this time.",
      growthAreas: "Unable to generate synthesis at this time.",
      narrative: "Unable to generate synthesis at this time.",
    }
  }

  const text = textBlock.text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return {
      strengths: "Unable to parse AI synthesis.",
      growthAreas: "Unable to parse AI synthesis.",
      narrative: "Unable to parse AI synthesis.",
    }
  }

  return JSON.parse(jsonMatch[0]) as {
    strengths: string
    growthAreas: string
    narrative: string
  }
}
