# HireFlow — Product Proposal & High-Level Design

---

## Product Vision

HireFlow is an AI-native HRMS built for medium and large enterprises that moves HR from reactive administration to proactive, intelligence-driven decision-making. The core thesis: every HR workflow that produces structured output — a scored resume, a policy answer, a performance assessment, a sentiment signal — should have an AI agent embedded in it as an opinionated co-processor, not as a bolt-on chatbot. This reduces manual work, surfaces insights that dashboards cannot, and makes every HR decision auditable.

The platform ships eight specialized AI agents across five HR domains, all observable through a real-time cost, latency, and accuracy monitoring console — making AI adoption measurable from day one, which is the prerequisite for enterprise buy-in.

---

## Client Problem Being Solved

Enterprise HR teams face three compounding problems:

**1. Volume without signal.** Hundreds of applications per open role, thousands of policy questions per month, dozens of review cycles per year. The data exists; the capacity to process it carefully does not. HR teams make fast, low-quality decisions under load.

**2. Compliance blind spots.** Job descriptions with inadvertent gender or age bias, policy answers given inconsistently by different HR reps, performance reviews with undocumented rationale — these create legal exposure that scales linearly with headcount.

**3. AI adoption opacity.** Enterprises that pilot AI for HR cannot answer: what did it cost per call? Was the output accurate? Which team is driving usage? Without this visibility, AI stays in pilot forever and never reaches procurement.

HireFlow addresses all three: structured AI output for every high-volume workflow, a bias-detection and escalation layer for compliance, and a built-in AgentOps console that answers "is this AI worth the cost?" with real per-agent, per-company data.

---

## Target Users / Personas

| Persona | Role | Primary Pain Point | HireFlow Value |
|---|---|---|---|
| **CHRO / HR Director** | Budget owner, decision maker | No visibility into AI ROI; afraid to commit | AgentOps: cost/call, latency, per-agent breakdown |
| **HR Admin** | Primary platform user | Manual resume screening; inconsistent policy answers | AI scoring, PolicyBot RAG, review synthesis |
| **Hiring Manager** | Collaborator on recruitment | Slow candidate pipeline; no signal on who to interview | Kanban + AI scores + targeted interview questions |
| **Employee** | End user, self-serve | Waits hours/days for basic HR policy answers | PolicyBot: instant, sourced, 24/7 answers |
| **Platform Admin** | IT / Ops | Multi-tenant provisioning and cross-company audit | SUPER_ADMIN role with full cross-company visibility |

---

## Business Assumptions

- **Buyer:** HR Director or CHRO at a 200–5,000-person company, evaluating either replacing a legacy HRMS or augmenting one with an AI layer
- **Pricing model:** SaaS, per-seat, tiered by headcount; AI token costs passed through with margin; AgentOps data justifies the premium
- **Procurement cycle:** 3–6 months; proof-of-concept on a demo tenant before contract signature
- **Compliance baseline:** GDPR-aware data handling assumed; SOC 2 Type II is the next enterprise gate
- **AI cost viability:** PolicyBot runs under $0.01/question at scale with prompt caching ($3/M input tokens, $15/M output tokens, ~90% cache hit rate on repeated calls against the same policy corpus)
- **Integration posture:** Enterprises expect HRIS exports/imports; API-first design enables connectors without rearchitecting

---

## AI-Native Capabilities

Eight production AI agents are embedded across five modules, all powered by Claude Sonnet 4.6 via the Anthropic API:

| Agent | Trigger | Structured Output | Pattern |
|---|---|---|---|
| **JD Parser** | Job post creation | Required skills, experience years | Tool use |
| **Bias Detector** | JD save / on-demand | Flagged phrases, DEI alternatives, risk level (LOW/MED/HIGH) | Tool use |
| **Resume Screener** | Candidate upload | Score 0–100, strengths, skill gaps | Tool use |
| **Interview Generator** | Candidate detail view | 3–5 targeted questions from identified gaps | Tool use |
| **PolicyBot** | Employee question | Sourced answer, confidence, auto-escalation to HR ticket | RAG + Tool use + Prompt caching |
| **Review Synthesizer** | HR triggers synthesis | Strengths, growth areas, narrative — one summary per employee | Tool use |
| **Survey Insight** | Survey results view | Keyword themes extracted from anonymous responses | JSON prompt |
| **Analytics Narrator** | Analytics page load | Natural-language summary of workforce metrics | Text prompt |

**Structured output discipline:** Anthropic's tool use API (not free-text parsing) is used everywhere typed data is needed. Output is schema-validated at the API call boundary — no regex parsing of AI prose.

**Prompt caching:** Applied to stable system prompts and policy document context blocks. PolicyBot costs drop ~90% on repeated questions against the same policy corpus within a 5-minute cache window.

**Full observability:** Every AI call passes through `observedAiCall()` — a wrapper that captures input tokens, output tokens, latency (ms), and cost (USD), and writes them fire-and-forget to an `AiCallLog` table. The SUPER_ADMIN AgentOps console queries this in real time, grouped by agent name and company.

---

## Scalability & Enterprise Considerations

- **Multi-tenancy:** `companyId` is present on every database model and every Prisma query. Cross-tenant data access is architecturally impossible — no query touches rows it doesn't own
- **Stateless API layer:** Vercel serverless functions scale horizontally and to zero. No shared in-process state between requests
- **Connection pooling:** Supabase transaction pooler (port 6543) handles connection limits across concurrent cold Lambda starts
- **Soft deletes only:** No hard deletes — status fields (`ACTIVE/INACTIVE`, `OPEN/CLOSED`) preserve full audit history for compliance forensics
- **Audit trail:** `AuditLog` table records every user action with entity, action type, and diff — enables forensic review and regulatory export
- **AI cost control:** AgentOps dashboard surfaces per-company AI spend, enabling SaaS chargeback or internal cost allocation

---

## Security & Compliance Assumptions

- **Authentication:** JWT sessions via NextAuth 5 with HttpOnly cookies and short TTL. No passwords stored in DB (demo uses email-only; production would add bcrypt or delegate to IdP)
- **Authorization:** Four-layer RBAC — middleware (route-level), API handler (role check → 403), data queries (`companyId` filter), and UI (`RoleGate` component + sidebar filtering). No role elevation from client
- **Data isolation:** Multi-tenant SQL with `companyId` on every table. No query can accidentally cross tenant boundaries without explicit code change
- **Secrets management:** All keys (`DATABASE_URL`, `ANTHROPIC_API_KEY`, `AUTH_SECRET`) in encrypted environment variables on Vercel. Zero secrets in codebase
- **Transport security:** TLS enforced end-to-end — Vercel HTTPS, Supabase SSL with `rejectUnauthorized` in production
- **AI data handling:** Resume and policy text is sent to Anthropic's API. Enterprises requiring data residency would need Anthropic's Enterprise tier or an on-premise model substitution (architecture supports swapping `lib/ai/client.ts`)
- **Compliance roadmap (not yet implemented):** SOC 2 Type II, GDPR data deletion flows (right to erasure), SSO/SAML via Okta or Azure AD

---

## Modules Intentionally Not Built

| Module | Reason Deferred |
|---|---|
| **Payroll** | Bank-grade security, country-specific tax rules, payment processor integrations — compliance scope alone exceeds prototype timeline |
| **Benefits Administration** | Carrier integrations, enrollment windows, jurisdiction-specific legal requirements — high complexity, low prototype signal |
| **Time & Attendance** | Requires hardware (badges, biometrics) or clock-in SDKs; no meaningful prototype without physical integration layer |
| **SSO / SAML** | Enterprise IdP integration (Okta, Azure AD) is table stakes for production but adds no AI-differentiation value in a prototype |
| **Email Notifications** | Leave approval alerts, review reminders — deferred in favor of in-app UI; avoids SMTP/SendGrid config dependency |
| **API Webhooks / Connectors** | Workday, BambooHR, ADP imports/exports — high enterprise value but requires stable vendor schemas and auth flows |
| **Mobile App** | Web prototype prioritized; responsive layout is present but native mobile UX deferred |
| **Advanced BI / Reporting** | Analytics page covers key KPIs; drill-downs, custom report builder, and CSV export deferred |

---

## Trade-offs Made During Implementation

| Decision | Trade-off | Rationale |
|---|---|---|
| **Monolith over microservices** | Individual services cannot scale independently | Right for prototype; single deploy, no network overhead, fast iteration |
| **Credentials auth only** | No Google/GitHub SSO | Demo environment; OAuth adds provider config complexity without showcasing AI features |
| **Keyword RAG vs. vector RAG** | Lower retrieval accuracy at scale (>100 docs) | No vector DB infrastructure needed; works well for typical policy corpus size; architecture supports swapping to pgvector |
| **JSON strings for array fields** | Less directly queryable in SQL | Prisma schema simplicity; parsed in application layer; acceptable at prototype scale |
| **Fire-and-forget AI logging** | Log writes can fail silently | Avoids blocking user-facing response latency; observability is non-critical path |
| **`prisma db push` over migrations** | No migration history for schema changes | Appropriate for rapid prototype iteration; production would switch to `prisma migrate` |
| **No email notifications** | Users must poll for status changes | Eliminates SMTP dependency; all core workflows demonstrable without third-party config |

---

---

# High-Level Design

---

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel Edge Network                      │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │              Next.js App Router (monolith)            │  │
│   │                                                       │  │
│   │  ┌─────────────────────┐  ┌────────────────────────┐ │  │
│   │  │  React Server        │  │  API Routes            │ │  │
│   │  │  Components +        │  │  (Node.js serverless)  │ │  │
│   │  │  Client Components   │  │  ├─ Auth (NextAuth 5)  │ │  │
│   │  │  (6 feature modules) │  │  ├─ CRUD (Prisma ORM)  │ │  │
│   │  └─────────────────────┘  │  └─ AI (Anthropic SDK)  │ │  │
│   │                           └────────────────────────┘ │  │
│   │  ┌──────────────────────────────────────────────────┐ │  │
│   │  │  Middleware: Auth check + RBAC (runs on every    │ │  │
│   │  │  request before page/route handler)              │ │  │
│   │  └──────────────────────────────────────────────────┘ │  │
│   └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬────────────────────┬─────────────┘
                           │                    │
                           ▼                    ▼
              ┌────────────────────┐  ┌──────────────────────┐
              │  Supabase          │  │  Anthropic API        │
              │  PostgreSQL        │  │  Claude Sonnet 4.6    │
              │  16 tables         │  │  (tool use + caching) │
              │  Multi-tenant      │  └──────────────────────┘
              │  Connection pooler │
              └────────────────────┘
```

---

## Data Flow — Three Key Paths

### Path 1: Recruitment (AI-heavy)

```
HR Admin creates job post (free text)
  → POST /api/recruitment/jobs
  → AI: JD Parser extracts { title, mustHaveSkills, niceToHaveSkills, experienceYears }
  → AI: Bias Detector flags gendered/ageist phrases with DEI alternatives
  → Job stored with structured requirements

Candidate uploads resume text
  → POST /api/recruitment/candidates/upload
  → AI: Resume Screener scores 0–100 vs job requirements
       returns { score, explanation, strengths, gaps }
  → Candidate record created with aiScore field

HR views Kanban board (sorted by AI score)
  → Drag card → PATCH /api/recruitment/candidates/[id]
  → Stage updated: APPLIED → SCREENED → INTERVIEW → OFFER → HIRED/REJECTED

HR clicks "Generate Interview Questions" on candidate
  → AI: Interview Generator produces 3–5 questions targeting identified gaps
```

### Path 2: PolicyBot (RAG)

```
Employee types question
  → POST /api/policybot/chat
  → Fetch all PolicyDocuments for company from DB
  → Keyword relevance scoring (TF-style, no vector DB)
  → Top 3 docs selected, trimmed to 2,000 chars each
  → Build cached context block (Anthropic ephemeral cache, 5-min TTL)
  → Claude (tool use) → { answer, sources, confidence, shouldEscalate }
  → If shouldEscalate → prisma.ticket.create() → HR ticket auto-opened
  → Instant structured answer returned to employee

HR Admin views escalated tickets
  → GET /api/policybot/tickets
  → Marks resolved when handled
```

### Path 3: Performance Reviews (Synthesis)

```
HR Admin creates review cycle
  → POST /api/reviews/cycles
  → Type: SELF_ONLY | MANAGER_ONLY | THREE_SIXTY

Reviewers submit structured Q&A
  → POST /api/reviews/[cycleId]/submit
  → PerformanceReview records created per reviewer/reviewee pair

HR triggers synthesis for an employee
  → POST /api/reviews/[cycleId]/synthesize
  → Fetch all PerformanceReview records for employee in cycle
  → Format as structured text (self / peer / manager sections)
  → AI: Review Synthesizer → { strengths[], growthAreas[], narrative }
  → aiSummary stored on employee's self-review record

Results page shows side-by-side:
  raw multi-rater reviews + AI synthesis card
```

---

## AI Components

```
lib/
├── ai/
│   ├── client.ts          Anthropic SDK singleton (shared across agents)
│   ├── recruitment.ts     4 agents: jd-parser, resume-scorer, bias-scanner,
│   │                                interview-gen
│   ├── policybot.ts       1 agent: RAG Q&A with keyword retrieval + escalation
│   ├── reviews.ts         1 agent: multi-rater synthesis
│   ├── surveys.ts         1 agent: sentiment theme extraction
│   └── analytics.ts       1 agent: narrative generation from metrics
│
└── agentops/
    └── observe.ts         observedAiCall() — universal wrapper
                           captures: tokens in/out, latency ms, cost USD
                           fire-and-forget write to AiCallLog table
```

**Tool use pattern (used by 6 of 8 agents):**
```
anthropic.messages.create({
  tools: [{ name, input_schema }],
  tool_choice: { type: "tool", name },   ← forces structured output, never free text
})
→ response.content[0].input             ← type-safe structured result
```

**Prompt caching pattern (PolicyBot + Review Synthesizer):**
```
messages: [{
  role: "user",
  content: [
    { type: "text", text: policyContext,
      cache_control: { type: "ephemeral" } },   ← cached for 5 min
    { type: "text", text: employeeQuestion }     ← not cached (changes per call)
  ]
}]
```

---

## User Roles

```
SUPER_ADMIN  ──  Platform admin, cross-company visibility, AgentOps access
    │
HR_ADMIN     ──  Full HR access within company, manages all modules
    │
MANAGER      ──  Read recruitment, approve team leave, view team employees
    │
EMPLOYEE     ──  Submit leave, use PolicyBot, submit performance reviews
```

**Enforcement is four-layer (defense in depth):**

| Layer | Mechanism |
|---|---|
| Route | `middleware.ts` — path-based role check before any page renders |
| API | `session.user.role` check in every route handler → HTTP 403 |
| Data | Every Prisma query includes `where: { companyId }` |
| UI | `RoleGate` component + sidebar nav filtered by role |

---

## External Integrations

| Integration | Status | Notes |
|---|---|---|
| **Anthropic API** | Implemented | Core AI engine; Claude Sonnet 4.6 |
| **Supabase PostgreSQL** | Implemented | Managed DB + transaction pooler for serverless |
| **Vercel** | Implemented | Serverless deployment, edge CDN, env var management |
| **NextAuth 5** | Implemented | JWT sessions, email-only credentials for demo |
| **SAML / SSO** | Roadmap | Okta, Azure AD — needed before enterprise sale |
| **ATS / HRIS connectors** | Roadmap | Workday, BambooHR import/export |
| **Payroll systems** | Roadmap | ADP, Gusto |
| **Email (transactional)** | Roadmap | SendGrid for leave approvals, review reminders |

---

## Deployment Architecture

```
GitHub (main branch)
  │  push → Vercel CI/CD
  ▼
Vercel Build Pipeline
  1. prisma generate          (generates type-safe Prisma client)
  2. next build               (compiles App Router + API routes)
  │
  ▼
Vercel Serverless Functions  (Node.js 20, stateless)
  - One function per API route file
  - pg.Pool connection reused within a warm Lambda instance
  - Stateless: no shared memory between invocations
  │
  ├──────────────────────────────────────┐
  ▼                                      ▼
Supabase PostgreSQL               Anthropic API
(ap-northeast-2 region)           (claude-sonnet-4-6)
  - Port 6543 (transaction pooler)
    for Vercel connections
  - Port 5432 (direct) for
    local dev and seed scripts
  - SSL enforced in production
```

**Environment variables (Vercel encrypted storage):**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase transaction pooler connection string |
| `ANTHROPIC_API_KEY` | Claude API access |
| `AUTH_SECRET` | NextAuth JWT signing key (32+ char random) |
| `NEXTAUTH_URL` | Canonical production domain |
| `AUTH_TRUST_HOST` | Required for NextAuth on Vercel |

---

## Database Schema — 16 Models, 3 Logical Groups

**Identity & Organisation**
```
Company ──< User
        ──< Employee ──< Employee  (self-referential: manager/reports tree)
        ──< Department ──< Employee
```

**HR Operations**
```
Company ──< Job ──< Candidate
        ──< PolicyDocument
        ──< Ticket ──── Employee
        ──< LeaveRequest ── Employee
        ──< LeaveBalance ── Employee
```

**AI & Audit**
```
Company ──< PulseSurvey ──< PulseSurveyResponse  (anonymous: no employeeId)
        ──< ReviewCycle ──< PerformanceReview
        ──< AiCallLog                             (per-call AI observability)
        ──< AuditLog ── User                      (per-action audit trail)
```

**Key design decisions:**
- All IDs are CUIDs (no sequential integers that leak record count)
- Soft deletes only — status fields preserve history for compliance
- `AiCallLog.companyId` is nullable — some AI calls have no company context
- Anonymous pulse survey responses have no `employeeId` — privacy by schema design
