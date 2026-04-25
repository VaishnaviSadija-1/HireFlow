import { anthropic } from "./client"
import { observedAiCall } from "@/lib/agentops/observe"

const SYSTEM_PROMPT = `You are an expert HR analytics advisor specializing in workforce retention and flight risk assessment. Your role is to synthesize employee flight risk data into concise, actionable executive summaries.

Guidelines:
- Write exactly 2-3 sentences in a professional but urgent tone
- Lead with the highest-impact risk (count of high-risk employees and their departments)
- Include a specific behavioral signal (low PTO usage or short tenure) as evidence
- Close with a concrete, actionable recommendation for HR leadership
- Be specific about departments and patterns — avoid generic statements
- Do not use bullet points or headers — write in flowing prose`

export interface FlightRiskEmployee {
  name: string
  department: string
  reasons: string[]
}

export async function generateRiskNarrative(
  highRiskEmployees: FlightRiskEmployee[]
): Promise<string> {
  if (highRiskEmployees.length === 0) {
    return "No employees are currently flagged as high flight risk. Continue monitoring tenure milestones and leave utilization patterns to catch early warning signals."
  }

  const employeeContext = highRiskEmployees
    .map(
      (e) => `- ${e.name} (${e.department}): ${e.reasons.join(", ")}`
    )
    .join("\n")

  const response = await observedAiCall({
    agentName: "analytics-risk-narrative",
    companyId: undefined,
    fn: () => anthropic.messages.create({
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
          content: `Generate an executive summary for the following ${highRiskEmployees.length} high flight risk employee(s):\n\n${employeeContext}\n\nProvide a 2-3 sentence summary highlighting key risks and recommended actions.`,
        },
      ],
    }),
  })

  const textBlock = response.content.find((b) => b.type === "text")
  return textBlock && textBlock.type === "text"
    ? textBlock.text
    : "Unable to generate risk narrative at this time."
}
