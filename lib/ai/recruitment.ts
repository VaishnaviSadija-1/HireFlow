import { anthropic } from "./client"
import { observedAiCall } from "@/lib/agentops/observe"

const MODEL = "claude-sonnet-4-6"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedJobDescription {
  title: string
  mustHaveSkills: string[]
  niceToHaveSkills: string[]
  experienceYears: number
  biasFlags: { phrase: string; suggestion: string }[]
}

export interface ResumeScore {
  score: number
  explanation: string
  strengths: string[]
  gaps: string[]
}

export interface BiasReport {
  flags: { phrase: string; type: string; suggestion: string }[]
  overallRisk: "LOW" | "MEDIUM" | "HIGH"
}

// ---------------------------------------------------------------------------
// Function 1: parseJobDescription
// ---------------------------------------------------------------------------

export async function parseJobDescription(jdText: string): Promise<ParsedJobDescription> {
  const response = await observedAiCall({
    agentName: "recruitment-jd-parser",
    companyId: undefined,
    fn: () => anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: `You are an expert HR analyst specializing in job description parsing and bias detection.
Extract structured information from job descriptions accurately and flag any potentially biased language.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        {
          name: "extract_job_details",
          description: "Extract structured details from a job description",
          input_schema: {
            type: "object" as const,
            properties: {
              title: {
                type: "string",
                description: "The job title",
              },
              mustHaveSkills: {
                type: "array",
                items: { type: "string" },
                description: "Required/must-have skills and qualifications",
              },
              niceToHaveSkills: {
                type: "array",
                items: { type: "string" },
                description: "Nice-to-have or preferred skills",
              },
              experienceYears: {
                type: "number",
                description: "Required years of experience (use 0 if not specified)",
              },
              biasFlags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    phrase: { type: "string" },
                    suggestion: { type: "string" },
                  },
                  required: ["phrase", "suggestion"],
                },
                description: "Potentially biased phrases with neutral alternatives",
              },
            },
            required: ["title", "mustHaveSkills", "niceToHaveSkills", "experienceYears", "biasFlags"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "extract_job_details" },
      messages: [
        {
          role: "user",
          content: `Parse this job description:\n\n${jdText}`,
        },
      ],
    }),
  })

  const toolUse = response.content.find((c) => c.type === "tool_use")
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("AI did not return tool use response for job parsing")
  }

  return toolUse.input as ParsedJobDescription
}

// ---------------------------------------------------------------------------
// Function 2: scoreResume
// ---------------------------------------------------------------------------

export async function scoreResume(
  resumeText: string,
  job: { title: string; requirements: string }
): Promise<ResumeScore> {
  let requirementsArray: string[] = []
  try {
    requirementsArray = JSON.parse(job.requirements)
  } catch {
    requirementsArray = [job.requirements]
  }

  const requirementsList = requirementsArray.join("\n- ")

  const response = await observedAiCall({
    agentName: "recruitment-resume-scorer",
    companyId: undefined,
    fn: () => anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: `You are an expert technical recruiter who evaluates candidate resumes against job requirements.
Score candidates objectively based on skills match, experience alignment, and overall fit.
Be fair and focus on relevant qualifications, not personal characteristics.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        {
          name: "score_candidate",
          description: "Score a candidate's resume against job requirements",
          input_schema: {
            type: "object" as const,
            properties: {
              score: {
                type: "number",
                description: "Overall match score from 0 to 100",
              },
              explanation: {
                type: "string",
                description: "2-3 sentence summary of the candidate's fit for the role",
              },
              strengths: {
                type: "array",
                items: { type: "string" },
                description: "Key strengths that match the job requirements",
              },
              gaps: {
                type: "array",
                items: { type: "string" },
                description: "Missing skills or experience gaps relative to requirements",
              },
            },
            required: ["score", "explanation", "strengths", "gaps"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "score_candidate" },
      messages: [
        {
          role: "user",
          content: `Score this candidate's resume for the "${job.title}" position.

Job Requirements:
- ${requirementsList}

Candidate Resume:
${resumeText}`,
        },
      ],
    }),
  })

  const toolUse = response.content.find((c) => c.type === "tool_use")
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("AI did not return tool use response for resume scoring")
  }

  const raw = toolUse.input as ResumeScore
  return {
    score: Math.min(100, Math.max(0, Math.round(raw.score))),
    explanation: raw.explanation,
    strengths: raw.strengths,
    gaps: raw.gaps,
  }
}

// ---------------------------------------------------------------------------
// Function 3: scanBias
// ---------------------------------------------------------------------------

export async function scanBias(jdText: string): Promise<BiasReport> {
  const response = await observedAiCall({
    agentName: "recruitment-bias-scanner",
    companyId: undefined,
    fn: () => anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: `You are a diversity, equity, and inclusion (DEI) specialist who identifies potentially biased language in job descriptions.
Look for: gendered language ("rockstar", "ninja", "dominant"), age bias ("young", "recent graduate", "digital native"),
cultural bias, ableist language, and unnecessarily exclusive requirements.
Suggest neutral, inclusive alternatives for each flagged phrase.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        {
          name: "report_bias",
          description: "Report bias findings in a job description",
          input_schema: {
            type: "object" as const,
            properties: {
              flags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    phrase: { type: "string", description: "The exact phrase from the JD" },
                    type: {
                      type: "string",
                      description: "Type of bias: GENDER | AGE | CULTURAL | ABLEIST | EXCLUSIONARY",
                    },
                    suggestion: { type: "string", description: "Inclusive alternative phrase" },
                  },
                  required: ["phrase", "type", "suggestion"],
                },
                description: "List of flagged biased phrases",
              },
              overallRisk: {
                type: "string",
                enum: ["LOW", "MEDIUM", "HIGH"],
                description: "Overall bias risk level",
              },
            },
            required: ["flags", "overallRisk"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "report_bias" },
      messages: [
        {
          role: "user",
          content: `Analyze this job description for potentially biased language:\n\n${jdText}`,
        },
      ],
    }),
  })

  const toolUse = response.content.find((c) => c.type === "tool_use")
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("AI did not return tool use response for bias scan")
  }

  return toolUse.input as BiasReport
}

// ---------------------------------------------------------------------------
// Function 4: generateInterviewQuestions
// ---------------------------------------------------------------------------

export async function generateInterviewQuestions(
  gaps: string[],
  jobTitle: string
): Promise<string[]> {
  const gapsList = gaps.length > 0 ? gaps.join(", ") : "general experience and motivation"

  const response = await observedAiCall({
    agentName: "recruitment-interview-gen",
    companyId: undefined,
    fn: () => anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: `You are an experienced interviewer who crafts targeted behavioral and technical interview questions.
Generate questions that help assess candidates on specific skill gaps or experience areas.
Questions should be open-ended, fair, and professionally worded.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        {
          name: "generate_questions",
          description: "Generate targeted interview questions",
          input_schema: {
            type: "object" as const,
            properties: {
              questions: {
                type: "array",
                items: { type: "string" },
                description: "3-5 targeted interview questions",
                minItems: 3,
                maxItems: 5,
              },
            },
            required: ["questions"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "generate_questions" },
      messages: [
        {
          role: "user",
          content: `Generate 3-5 targeted interview questions for a "${jobTitle}" candidate.
The candidate has the following gaps to explore: ${gapsList}`,
        },
      ],
    }),
  })

  const toolUse = response.content.find((c) => c.type === "tool_use")
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("AI did not return tool use response for interview questions")
  }

  const result = toolUse.input as { questions: string[] }
  return result.questions
}
