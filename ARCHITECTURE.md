# HireFlow — Architecture

## System Overview

HireFlow is a multi-tenant HRMS built as a Next.js monolith. The App Router handles both the React UI and the REST API in a single codebase. PostgreSQL (Supabase) is the only database. Claude AI is called directly from API routes — no separate AI service.

```
Browser
  │
  ▼
Next.js (Vercel Edge Network)
  ├── App Router UI   (RSC + Client components)
  ├── API Routes      (Node.js serverless functions)
  │     ├── Auth      (NextAuth 5)
  │     ├── CRUD      (Prisma → PostgreSQL)
  │     └── AI        (Anthropic SDK → Claude)
  └── Middleware      (Auth + RBAC enforcement)
         │
         ▼
    PostgreSQL (Supabase)          Anthropic API
```

---

## Request Lifecycle

### Page load (authenticated route)

```
1. Browser → Vercel Edge
2. Middleware (auth.config.ts)
   - Reads NextAuth JWT from cookie
   - If missing → redirect /login
   - If role insufficient → redirect /
3. React Server Component renders
   - Calls auth() to read session
   - Queries Prisma directly (server-side, no API hop)
   - Returns HTML with embedded data
4. Client components hydrate
```

### API call (mutation or AI)

```
1. Client component → fetch /api/...
2. Next.js API route handler
   a. auth() — verify session
   b. Role check — 403 if insufficient
   c. resolveCompanyId() — handle SUPER_ADMIN null case
   d. Prisma query or AI call
   e. If AI call → observedAiCall() wrapper
      - Execute Claude API call
      - Extract token counts + latency
      - Calculate cost estimate
      - Fire-and-forget log to AiCallLog table
3. JSON response
```

---

## Authentication

**Provider:** NextAuth 5 (beta) with JWT strategy. No OAuth — email-only credentials (demo environment).

**Flow:**
```
Login form → signIn("credentials", { email })
  → authorize() callback (lib/auth.ts)
      → prisma.user.findUnique({ where: { email } })
      → returns { id, email, name, role, companyId, employeeId, companyName }
  → JWT callback populates token with role + company fields
  → Session callback exposes those fields on session.user
```

**Middleware** (`lib/auth.config.ts`) runs on every request before the page/route handler:
- Unauthenticated → redirect `/login`
- API routes unauthenticated → `401 { error: "Unauthorized" }`
- `/admin/*` requires `SUPER_ADMIN`
- `/recruitment/*` blocked for `EMPLOYEE`

**SUPER_ADMIN edge case:** Platform admin has no `companyId` in the DB. All API routes and pages use `resolveCompanyId()` (`lib/companyId.ts`) which falls back to the first company when `companyId` is null.

---

## RBAC (Role-Based Access Control)

Four roles with escalating permissions:

```
SUPER_ADMIN > HR_ADMIN > MANAGER > EMPLOYEE
```

**Enforcement layers:**

| Layer | Mechanism |
|-------|-----------|
| Route-level | Middleware path checks (`auth.config.ts`) |
| API-level | `session.user.role` check → 403 |
| Data-level | Queries filtered by `companyId`, `managerId`, `employeeId` |
| UI-level | `RoleGate` component, sidebar `NAV_ITEMS` filtered by role |

**Permissions matrix** (`lib/rbac.ts`):

| Permission | SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE |
|-----------|-------------|----------|---------|----------|
| employees:read | ✓ | ✓ | ✓ (team) | — |
| employees:write | ✓ | ✓ | — | — |
| recruitment:read | ✓ | ✓ | ✓ | — |
| recruitment:write | ✓ | ✓ | — | — |
| leave:read | ✓ | ✓ | ✓ (team) | ✓ (own) |
| leave:write | ✓ | ✓ | ✓ (approve) | ✓ (request) |
| tickets:read | ✓ | ✓ | — | ✓ (own) |
| analytics:read | ✓ | ✓ | — | — |
| agentops:read | ✓ | — | — | — |

---

## Database Schema

**16 models across 3 logical groups:**

### Identity & Organisation
```
Company ──< User
        ──< Employee ──< Employee (self-ref: manager/reports)
        ──< Department ──< Employee
```

### HR Operations
```
Company ──< Job ──< Candidate
        ──< PolicyDocument
        ──< Ticket ──── Employee
        ──< LeaveRequest ── Employee
        ──< LeaveBalance ── Employee
```

### AI & Audit
```
Company ──< PulseSurvey ──< PulseSurveyResponse
        ──< ReviewCycle ──< PerformanceReview
        ──< AiCallLog
        ──< AuditLog ── User
```

**Key design decisions:**
- All IDs are CUIDs (no auto-increment integers)
- JSON fields stored as strings and parsed in application code (skills, requirements, answers, questions)
- `AiCallLog.companyId` is optional — some calls have no company context
- No hard delete — status fields (`ACTIVE`/`INACTIVE`, `OPEN`/`CLOSED`) used instead
- Multi-tenancy enforced by `companyId` on every model (every query includes `where: { companyId }`)

---

## AI Architecture

### Agent Inventory

| Agent | File | Trigger | Pattern |
|-------|------|---------|---------|
| `resume-screener` | `lib/ai/recruitment.ts` | Candidate upload | Tool use → structured score |
| `bias-detector` | `lib/ai/recruitment.ts` | Job post save / on-demand | Tool use → flagged phrases |
| `jd-parser` | `lib/ai/recruitment.ts` | Job post create | Tool use → structured JD |
| `interview-generator` | `lib/ai/recruitment.ts` | Candidate detail page | Streaming text |
| `policybot` | `lib/ai/policybot.ts` | Employee question submit | RAG + tool use |
| `review-synthesizer` | `lib/ai/reviews.ts` | HR triggers synthesis | JSON prompt → structured summary |
| `survey-insight` | `lib/ai/surveys.ts` | Survey results page | JSON prompt → keyword themes |
| `analytics-narrator` | `lib/ai/analytics.ts` | Analytics page load | Text prompt → narrative |

### Tool Use Pattern (Recruitment)

```typescript
// All recruitment calls use tool_use for reliable structured output
anthropic.messages.create({
  model: "claude-sonnet-4-6",
  tools: [{
    name: "score_resume",
    input_schema: {
      type: "object",
      properties: {
        score:       { type: "number" },      // 0-100
        explanation: { type: "string" },
        strengths:   { type: "array" },
        gaps:        { type: "array" },
      }
    }
  }],
  tool_choice: { type: "tool", name: "score_resume" },
  messages: [...]
})
// Extract: response.content[0].input
```

### RAG Pattern (PolicyBot)

```
1. Fetch all PolicyDocuments for company
2. Keyword-filter: score each doc by matching words from the question
3. Take top 3 docs, trim to 2000 chars each
4. Build context string
5. Call Claude with context + prompt caching (ephemeral) on context block
6. Tool use for structured output: { answer, sources, confidence, shouldEscalate }
7. If shouldEscalate → create Ticket record
```

### Prompt Caching

Ephemeral cache control is applied to:
- System messages (stable across calls, cached for 5 min)
- Policy document context blocks (stable for a session)
- Review synthesis system prompt

Caching reduces cost by ~90% on repeated calls to the same agent within a cache window.

### Observability Wrapper

Every Claude call goes through `observedAiCall()`:

```typescript
const result = await observedAiCall({
  agentName: "resume-screener",
  companyId,
  fn: () => anthropic.messages.create({ ... }),
})

// Internally:
// 1. Start timer
// 2. Execute fn()
// 3. Extract usage.input_tokens, usage.output_tokens
// 4. costUsd = (inputTokens * 3 + outputTokens * 15) / 1_000_000
// 5. prisma.aiCallLog.create({ ... })  ← fire-and-forget
// 6. Return original response
```

Cost rates: `claude-sonnet-4-6` at $3/M input tokens, $15/M output tokens.

---

## Data Flow: Key Features

### Recruitment Pipeline

```
HR creates job ──→ AI parses JD → stores structured requirements
                                          │
Employee uploads resume ──────────────────▼
  → API receives resumeText
  → scoreResume(jobRequirements, resumeText) → Claude → {score, explanation}
  → Candidate created with aiScore
  → HR views candidates sorted by score on Kanban
  → Drag card → PATCH /api/recruitment/candidates/[id] → updates stage
```

### PolicyBot RAG

```
Employee types question
  → POST /api/policybot/chat
  → Fetch company policy docs
  → Keyword relevance scoring
  → Top 3 docs → context string (6000 chars max)
  → Claude (with cached context) → { answer, shouldEscalate }
  → If escalated → prisma.ticket.create()
  → Return answer to UI
```

### Performance Review Synthesis

```
HR opens cycle results → clicks "Generate AI Summary" for employee
  → POST /api/reviews/[cycleId]/synthesize
  → Fetch all PerformanceReviews for employee in cycle
  → Format as text: "--- SELF REVIEW ---\nQ: ...\nA: ..."
  → Call synthesizeReviews() → Claude → { strengths, growthAreas, narrative }
  → Store as JSON in PerformanceReview.aiSummary (on self-review record)
  → Results page reads aiSummary and renders AI summary card
```

---

## Prisma Setup

**Adapter:** `@prisma/adapter-pg` with `pg.Pool`. This is the native PostgreSQL driver — not the Prisma binary engine. Required for Vercel's serverless environment.

```typescript
// lib/prisma.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
```

**Singleton pattern:** `globalThis.prisma` prevents multiple PrismaClient instances during Next.js hot-reload in development.

**Connection strings:**
- Local dev: direct connection (`db.xxx.supabase.co:5432`)
- Vercel production: transaction pooler (`pooler.supabase.com:6543`)

**Schema management:** `prisma db push` (no migration files used). The `migrations/` folder contains an initial SQLite migration from a previous setup — it is not used for the current PostgreSQL deployment.

---

## Deployment Architecture

```
GitHub (main branch)
  │  (manual deploy via vercel CLI or dashboard)
  ▼
Vercel Build
  1. prisma generate      (generates Prisma client)
  2. next build           (compiles App Router)
  │
  ▼
Vercel Serverless Functions (Node.js 20)
  - One function per API route
  - Stateless — no shared memory between invocations
  - pg.Pool reused within a single Lambda warm instance
  │
  ▼
Supabase PostgreSQL (ap-northeast-2)
  - Transaction pooler (port 6543) for Vercel connections
  - Direct connection (port 5432) for local dev and seed scripts
```

**Environment variables on Vercel:**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Transaction pooler connection string |
| `AUTH_SECRET` | NextAuth JWT signing key (32+ chars) |
| `ANTHROPIC_API_KEY` | Claude API access |
| `NEXTAUTH_URL` | Canonical app URL (production domain) |
| `AUTH_TRUST_HOST` | Required for NextAuth on Vercel |
