# HireFlow — Product Specifications

## Overview

HireFlow is a multi-tenant, AI-native HRMS targeting small-to-mid-size companies. It covers the full HR lifecycle from recruitment through performance management, with Claude AI embedded at every intelligence layer.

**Tenancy model:** Each `Company` is fully isolated. All data queries include `companyId`. The `SUPER_ADMIN` role spans all companies (platform operator).

---

## Module 1 — Authentication & Access Control

### Login
- Email-only credentials (no password in demo mode)
- Quick-login tiles on login page for each demo persona
- No session expiry configured (JWT)
- Redirects to `/` on success, `/login` on failure

### Roles

| Role | Description | Assigned to |
|------|-------------|-------------|
| `SUPER_ADMIN` | Platform-level admin, no company binding | `admin@hireflow.dev` |
| `HR_ADMIN` | Full access within company | `hr@nexus.tech` (Lisa Park) |
| `MANAGER` | Team-scoped access, approve actions | `manager@nexus.tech` (Sarah Chen) |
| `EMPLOYEE` | Self-service only | `emp@nexus.tech` (Alex Rivera) |

### Route Guards

| Route prefix | Minimum role |
|-------------|-------------|
| `/admin/*` | SUPER_ADMIN |
| `/analytics` | HR_ADMIN |
| `/recruitment/*` | MANAGER |
| `/employees/*` | MANAGER |
| `/leave/*` | EMPLOYEE |
| `/policybot/*` | EMPLOYEE |
| `/surveys/*` | EMPLOYEE |
| `/reviews/*` | EMPLOYEE |

---

## Module 2 — Employee Directory

### Employee List (`/employees`)
- Search by name, title, department, location
- Filterable table with status badge (Active / Inactive)
- "Add Employee" button (HR_ADMIN only) — opens slide-over sheet
- Clicking a row navigates to employee profile

### Employee Profile (`/employees/[id]`)
- Avatar (initials), name, title, department, location, hire date
- Skills chips (parsed from JSON array)
- Leave balance summary (Annual / Sick / Casual remaining days)
- Recent leave requests
- Linked performance reviews (if any)

### Add Employee (`AddEmployeeSheet`)
- Fields: name, email, title, department (dropdown), location, hire date, gender, manager (dropdown), skills (comma-separated)
- Creates employee record + auto-creates leave balances (15 Annual, 10 Sick, 5 Casual)
- HR_ADMIN and SUPER_ADMIN only

### Org Chart (`/employees/org-chart`)
- Hierarchical tree view built from `managerId` self-reference
- Shows name, title, department per node
- Responsive collapse on mobile

---

## Module 3 — Recruitment

### Job Listings (`/recruitment`)
- Cards per open job with candidate counts per pipeline stage
- Status filter (OPEN / CLOSED / DRAFT)
- "New Job" button for HR_ADMIN

### Create Job (`/recruitment/new`)
- Free-text description input
- AI parsing: Claude extracts title, requirements array, and structured fields on save
- Draft saved immediately; AI enrichment is synchronous

### Job Detail + Kanban (`/recruitment/[id]`)
- Six-column Kanban: Applied → Screened → Interview → Offer → Hired → Rejected
- Candidate cards show name, AI score (colour-coded), current stage
- Drag-and-drop moves candidate between stages (PATCH to API)
- "Add Candidate" — opens resume text input, triggers AI scoring immediately
- "Bulk Upload" — CSV with name/email/resumeText columns, each row scored in sequence
- "Bias Report" button — runs bias scan on the job description, shows flagged phrases with category (gender / age / ableist / cultural) and severity

### AI Resume Scoring
- Score: 0–100 float
- Output: `{ score, explanation, strengths[], gaps[] }`
- Stored on `Candidate.aiScore` and `Candidate.aiExplanation`
- Colour thresholds: ≥ 80 green, 60–79 yellow, < 60 red

### Bias Detector
- Categories: gender-coded language, age bias, cultural exclusion, ableist language
- Output: `{ overallRisk: low|medium|high, flags: [{ phrase, category, suggestion }] }`
- Shown in `BiasReport` component with phrase highlights and rewrite suggestions

### Interview Question Generator
- Triggered from candidate detail view
- Input: job requirements + candidate skill gaps
- Output: 5–8 targeted questions in plain text
- Streamed to UI (no tool use — stream pattern)

---

## Module 4 — Leave Management

### Leave Request (`/leave`)

**Employee view:**
- Submit new leave request: type (Annual / Sick / Casual), start date, end date, reason
- View own pending and historical requests with status badge
- Leave balance widget shows total / used / remaining per type

**Manager view:**
- Approve or reject pending requests for direct reports
- Reason optional on rejection
- Table sorted by submission date

**HR_ADMIN view:**
- All company leave requests
- Can approve/reject any request regardless of reporting line

### Leave Types & Policy
- **Annual:** 20 days total, accrues monthly, 5-day max carryover
- **Sick:** 10 days total, no carryover, doctor's note required after 3 consecutive days
- **Casual:** 5 days total, manager approval required, same-day at discretion

### Leave Calendar (`/leave/calendar`)
- Month grid showing all approved leave by employee
- Colour-coded by leave type
- Department filter

### Leave Balance
- Balances created automatically when employee is added
- `used` incremented when leave is approved (not when requested)
- Balance displayed as: `total - used = remaining`

---

## Module 5 — PolicyBot

### Chat Interface (`/policybot`)
- Free-text question input
- Answer displayed with source document names and confidence level
- "Escalate to HR" button on every answer (creates a ticket)
- Auto-escalation when Claude flags `shouldEscalate: true` (e.g. discrimination, legal risk)
- No conversation history — each question is independent

### RAG Pipeline
- Policy documents fetched from DB
- Keyword relevance scoring to select top 3 docs
- Context capped at 2000 chars per document
- Claude returns `{ answer, sources, confidence: low|medium|high, shouldEscalate }`

### Policy Document Upload (`HR_ADMIN only`)
- PDF upload via drag-and-drop
- `pdf-parse` extracts raw text content
- Stored as `PolicyDocument` with filename + content
- Immediately available to RAG pipeline

### Tickets (`/policybot/tickets`)
- List of all created support tickets (HR_ADMIN sees all; Employee sees own)
- Status: Open / Resolved
- Escalation badge for sensitive tickets
- HR can mark tickets resolved

---

## Module 6 — Pulse Surveys

### Survey List (`/surveys`)
- Active surveys only (admin can archive by setting `active: false`)
- HR_ADMIN sees: title, cadence badge, response count, "View results →" link
- Employee / Manager sees: title + inline response form

### Create Survey (`HR_ADMIN only`)
- Title, cadence (One-time / Weekly / Biweekly / Monthly)
- Target: All employees or specific department
- Optional end date
- Question builder: add questions with type (Rating 1–10 or Open text)
- Minimum 1 question required

### Response Form (Employee / Manager)
- Rating questions: 1–10 slider or button group
- Text questions: textarea
- Anonymous — no `employeeId` stored, only `deptId` (department-level attribution)
- One response per `weekOf` window enforced at UI level

### Survey Results (`/surveys/[id]/results`)
- Response count and department breakdown
- Sentiment heatmap: average rating per question per week, colour gradient (red → green)
- AI keyword extraction for text answers: top themes with frequency count
- HR_ADMIN only

---

## Module 7 — Performance Reviews

### Review Cycles (`/reviews`)
- List all cycles with status badge (Open / Closed / Results Shared)
- Progress bar: submitted / total reviews
- "Create Cycle" for HR_ADMIN

### Cycle Types

| Type | Reviewer roles created |
|------|----------------------|
| `SELF_ONLY` | Self review per employee |
| `MANAGER_ONLY` | Manager review per direct report |
| `THREE_SIXTY` | Self + Manager per employee |

### Create Cycle (`HR_ADMIN only`)
- Name, type, start date, deadline
- On create: `PerformanceReview` records created for each employee/reviewer pair
- Status starts `OPEN`

### Cycle Detail (`/reviews/[cycleId]`)
- Table of all employees in the cycle
- Per-employee row shows: self submitted (✓/—), manager submitted (✓/—), AI summary generated (✓/—)
- "Submit self review" link for logged-in employee's own row
- "Submit manager review" link for managers (per direct report)
- "Generate AI Summary" button (HR_ADMIN only, after both reviews submitted)
- "View Results" navigates to results page

### Self Review Form
Questions:
1. Biggest accomplishments this period (textarea)
2. Goals fell short on, and why (textarea)
3. Skills to develop next period (textarea)
4. Overall performance rating (1–5)
5. Support needed from manager (textarea, optional)

### Manager Review Form
Questions:
1. Standout strengths (textarea)
2. Most important growth areas (textarea)
3. Collaboration effectiveness rating (1–5)
4. Overall performance rating (1–5)
5. Promotion readiness (1–5, optional)

### AI Synthesis
- Triggered per employee by HR_ADMIN after both reviews are submitted
- Claude reads all submitted reviews in text form
- Returns `{ strengths, growthAreas, narrative }` (2–3 sentences each)
- Stored as JSON in `PerformanceReview.aiSummary` on the self-review record
- Displayed on results page as highlighted summary card

### Results Page (`/reviews/[cycleId]/results/[employeeId]`)
- AI summary card (indigo gradient, strengths / growth areas / narrative)
- Self-rating vs manager-rating side by side with visual dots
- Full self-review answers
- Full manager-review answers (HR_ADMIN and MANAGER only)
- Accessible to: HR_ADMIN, MANAGER (for their reports), EMPLOYEE (own record only)

---

## Module 8 — Analytics

**Accessible to:** HR_ADMIN and SUPER_ADMIN only.

### Hiring Funnel
- Bar or funnel chart showing candidate counts at each pipeline stage
- Aggregated across all open jobs for the company

### Department Breakdown
- Headcount per department
- Donut or bar chart

### Gender Breakdown
- Headcount by gender field
- Donut chart with counts and percentages

### Leave Overview
- Total days requested, approved, rejected per leave type
- Month-level aggregation

### Flight Risk Table
- Employees ranked by risk score
- Risk factors: tenure < 1 year, high leave utilisation, leave rejections
- Claude generates a 2–3 sentence executive narrative summarising the risk landscape
- Table columns: Employee, Department, Tenure, Risk Score, Risk Factors

---

## Module 9 — AgentOps (Super Admin)

**Accessible to:** SUPER_ADMIN only (`/admin/agentops`).

### Dashboard
- Total calls, total tokens, total cost (USD) in summary cards
- Per-agent breakdown table:
  - Agent name
  - Call count
  - Average latency (ms)
  - Total input tokens
  - Total output tokens
  - Total cost (USD)
- Time-series chart of calls per day (last 30 days)

### Agents Tracked

| Agent | Feature |
|-------|---------|
| `resume-screener` | Recruitment — score resumes |
| `bias-detector` | Recruitment — scan job descriptions |
| `jd-parser` | Recruitment — parse job descriptions |
| `interview-generator` | Recruitment — generate questions |
| `policybot` | PolicyBot — RAG answers |
| `review-synthesizer` | Reviews — 360° synthesis |
| `survey-insight` | Surveys — keyword extraction |
| `analytics-narrator` | Analytics — flight risk narrative |

### Cost Model
- `claude-sonnet-4-6`: $3.00 per million input tokens, $15.00 per million output tokens
- Cost calculated per call: `(inputTokens × 3 + outputTokens × 15) / 1,000,000`

---

## Data Model Summary

| Entity | Key Fields |
|--------|-----------|
| `Company` | name, domain |
| `User` | email, role, companyId?, employeeId? |
| `Employee` | name, email, title, departmentId, managerId, skills (JSON), hireDate, status, gender |
| `Department` | name, companyId |
| `Job` | title, description, requirements (JSON), status |
| `Candidate` | resumeText, aiScore, aiExplanation (JSON), stage |
| `PolicyDocument` | filename, content (extracted text) |
| `Ticket` | question, aiAnswer, escalated, resolved |
| `LeaveRequest` | type, startDate, endDate, reason, status, managerId |
| `LeaveBalance` | type, total, used |
| `PulseSurvey` | title, questions (JSON), cadence, targetType, targetId?, active, endsAt |
| `PulseSurveyResponse` | answers (JSON), weekOf, deptId? (anonymous) |
| `ReviewCycle` | name, type, startDate, deadline, status |
| `PerformanceReview` | revieweeId, reviewerId, reviewerRole, answers (JSON), overallRating?, aiSummary? (JSON) |
| `AiCallLog` | agentName, inputTokens, outputTokens, latencyMs, costUsd |
| `AuditLog` | userId, action, entity, entityId, diff (JSON) |

---

## API Reference

### Employees
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/employees` | MANAGER+ | List employees (company-scoped) |
| POST | `/api/employees` | HR_ADMIN+ | Create employee |
| GET | `/api/employees/[id]` | MANAGER+ | Get employee detail |
| PUT | `/api/employees/[id]` | HR_ADMIN+ | Update employee |

### Recruitment
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/recruitment/jobs` | MANAGER+ | List jobs |
| POST | `/api/recruitment/jobs` | HR_ADMIN+ | Create job (triggers JD parse) |
| GET | `/api/recruitment/jobs/[id]` | MANAGER+ | Get job + candidates |
| PUT | `/api/recruitment/jobs/[id]` | HR_ADMIN+ | Update job |
| POST | `/api/recruitment/candidates` | MANAGER+ | Add candidate (triggers scoring) |
| POST | `/api/recruitment/candidates/upload` | MANAGER+ | Bulk CSV upload |
| PUT | `/api/recruitment/candidates/[id]` | MANAGER+ | Update stage |
| GET | `/api/recruitment/bias` | HR_ADMIN+ | Get bias report for job |

### Leave
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/leave/requests` | EMPLOYEE+ | List requests (role-filtered) |
| POST | `/api/leave/requests` | EMPLOYEE+ | Create request |
| PUT | `/api/leave/requests/[id]` | MANAGER+ | Approve / Reject |
| GET | `/api/leave/balance` | EMPLOYEE+ | Get own leave balances |

### PolicyBot
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/policybot/chat` | EMPLOYEE+ | Ask question (RAG) |
| POST | `/api/policybot/upload` | HR_ADMIN+ | Upload policy PDF |
| GET | `/api/policybot/tickets` | EMPLOYEE+ | List tickets |
| PUT | `/api/policybot/tickets/[id]` | HR_ADMIN+ | Resolve ticket |

### Surveys
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/surveys` | EMPLOYEE+ | List active surveys |
| POST | `/api/surveys` | HR_ADMIN+ | Create survey |
| POST | `/api/surveys/[id]/respond` | EMPLOYEE+ | Submit response |
| GET | `/api/surveys/[id]/results` | HR_ADMIN+ | Get results + AI themes |

### Reviews
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reviews/cycles` | EMPLOYEE+ | List cycles |
| POST | `/api/reviews/cycles` | HR_ADMIN+ | Create cycle |
| GET | `/api/reviews/[cycleId]` | EMPLOYEE+ | Get cycle + reviews |
| POST | `/api/reviews/[cycleId]/submit` | EMPLOYEE+ | Submit review |
| POST | `/api/reviews/[cycleId]/synthesize` | HR_ADMIN+ | Trigger AI synthesis |
| GET | `/api/reviews/[cycleId]/results/[employeeId]` | EMPLOYEE+ | Get results |

### Analytics & Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/analytics/overview` | HR_ADMIN+ | All analytics data |
| GET | `/api/admin/agentops` | SUPER_ADMIN | AI call logs + metrics |
