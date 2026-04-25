# PRD: Pulse Survey Engine & 360° Performance Reviews
**HireFlow HRMS — Premium Differentiator Features**

---

## 1. Summary

This document covers two interconnected features for HireFlow: an **Employee Pulse Survey Engine with Sentiment Heatmap** that gives HR real-time morale intelligence, and a **360° Performance Review System with AI Synthesis** that replaces manual, bias-prone review writing with structured, AI-assisted feedback cycles. Together they transform HireFlow from a functional HRMS into a people-intelligence platform that enterprise buyers will pay for.

---

## 2. Contacts

| Name | Role | Note |
|------|------|------|
| Vaishnavi Sadija | Product Owner / Developer | Decision maker |
| HR Admin (persona) | Primary user | Creates surveys, runs review cycles |
| Manager (persona) | Secondary user | Approves reviews, sees team heatmap |
| Employee (persona) | End user | Submits pulse responses, writes peer reviews |

---

## 3. Background

### What is this about?
Most demo HRMS products cover the basics — leave, recruitment, org charts. HireFlow already does this well. But two glaring gaps exist in the current product that real HR buyers immediately notice:

1. **Morale is invisible.** The existing flight risk model is a lagging indicator — it tells you who might leave after the damage is done. There is no way to track *how employees feel right now* at scale.

2. **Performance management is absent.** There is no way to conduct structured performance reviews. Without this, HireFlow cannot manage the full employee lifecycle. It is the most-purchased HR module after payroll.

### Why now?
- The existing analytics module has the infrastructure (charts, department breakdowns) to host a heatmap natively.
- The AI layer (Claude Sonnet 4.6) is already integrated — synthesizing feedback text is a natural next use case.
- The schema already has `Employee`, `Department`, `Manager` relationships needed to route reviews and surveys.

---

## 4. Objective

### Goal
Give HR teams a real-time window into employee sentiment AND a structured, fair process for evaluating performance — both powered by Claude AI.

### Why it matters
- **For HR Admins:** Saves 4–6 hours per manager per review cycle. Catches morale problems 4–6 weeks earlier than exit interviews.
- **For the Product:** Elevates HireFlow from "assignment project" to "product I would actually buy." These two modules are table-stakes for Series A HRMS companies.
- **For the Business:** Performance and pulse are the two modules enterprises most commonly buy as standalone tools (Lattice, Culture Amp, 15Five all built $500M+ businesses on them alone).

### Key Results (SMART)
- **KR1:** HR Admin can launch a pulse survey in under 2 minutes and see department-level sentiment within 24 hours of responses.
- **KR2:** A full 360° review cycle (self + peers + manager) can be completed end-to-end within the app with zero external tools.
- **KR3:** Claude generates a review summary narrative for each employee that HR and managers rate as "accurate or better" in user testing.
- **KR4:** Managers see their team's sentiment trend over the last 4 weeks on the analytics page.

---

## 5. Market Segment

### Who is this for?
- **Primary:** HR Admins at companies with 50–500 employees who currently use spreadsheets for performance reviews and have no way to measure morale systematically.
- **Secondary:** Managers who want to understand their team's health without scheduling 1-on-1s with every person.
- **Tertiary:** Employees who want their voice heard anonymously and want feedback that helps them grow.

### Constraints
- Must work within the existing role system: `SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`.
- Pulse survey responses must be **anonymous** — employees will not participate if they think their manager can see individual answers.
- Performance reviews must be **private** (self + manager only, or 360° with blinded peer names) until HR releases results.
- Must work within the existing Next.js + Prisma + PostgreSQL + Claude stack. No new infrastructure.

---

## 6. Value Proposition

### Jobs users are trying to do
| User | Job | Current pain |
|------|-----|-------------|
| HR Admin | Know if morale is falling before people quit | Only learns from exit interviews — too late |
| HR Admin | Run fair, consistent performance reviews | Uses Word templates emailed around; loses track of submissions |
| Manager | Understand team health without 1-on-1 burnout | No data; relies on gut feel |
| Employee | Give honest feedback without fear of retaliation | No anonymous channel exists |
| Employee | Receive structured, specific feedback to grow | Review feedback is generic or nonexistent |

### Gains
- HR sees a color-coded morale heatmap by department, updated weekly.
- Claude writes a fair, balanced review narrative so managers don't have to.
- Employees get specific, actionable feedback instead of "meets expectations."
- Review cycles have a defined end date — no more chasing 30 managers for submissions.

### Pains avoided
- No more annual review anxiety — continuous pulse makes reviews feel less surprising.
- No more bias in reviews — Claude flags language patterns that favor one demographic.
- No more lost submissions — the app tracks completion and sends reminders.

---

## 7. Solution

### 7.1 User Flows

#### Pulse Survey Flow
```
HR Admin creates survey (2 questions max) → sets frequency (weekly/biweekly) → employees get in-app notification → 
employee answers anonymously → results aggregate by department → 
HR Admin sees heatmap → Manager sees team aggregate score (not individual answers)
```

#### Performance Review Flow
```
HR Admin opens a review cycle (sets participants, deadline) → 
employees submit self-review → peers submit peer feedback (blinded) → 
manager submits manager review → Claude synthesizes all inputs → 
HR Admin + Manager review AI summary → results shared with employee
```

---

### 7.2 Key Features

#### FEATURE A: Pulse Survey Engine

**A1 — Survey Builder (HR Admin)**
- Create a survey with 1–2 questions
- Question types: 1–10 rating scale + optional free-text comment
- Set cadence: one-time, weekly, biweekly, monthly
- Target: all employees, specific department, or specific team
- Auto-deactivates after end date

**A2 — Employee Survey Response**
- In-app notification banner when a new survey is active
- Simple, mobile-friendly response form (rating slider + optional comment box)
- Response is anonymous — no `employeeId` stored against individual answers, only `departmentId` + `companyId`
- Confirmation message after submit; cannot re-submit same survey

**A3 — Sentiment Heatmap (HR Admin + Manager)**
- Lives on the Analytics page as a new section
- Grid: Departments (rows) × Weeks (columns)
- Cell color: Red (1–4) → Yellow (5–7) → Green (8–10) based on average score
- Hover tooltip: avg score, response rate, and top recurring keywords from free-text
- Managers see only their department's row
- HR Admin sees all departments
- Rolling 8-week window (shows trend, not just snapshot)

**A4 — AI Keyword Extraction**
- Claude reads free-text comments (anonymized, stripped of names) and extracts the top 3–5 recurring themes per department per week
- Example output: "workload (mentioned 8x), unclear priorities (5x), team morale positive (4x)"
- Displayed as tags in the heatmap tooltip and in a "Pulse Insights" panel below the heatmap

---

#### FEATURE B: 360° Performance Review System

**B1 — Review Cycle Management (HR Admin)**
- Create a review cycle: name, start date, deadline, review type (self-only / manager-only / 360°)
- Select participants: all employees, or specific departments/individuals
- See cycle progress dashboard: X of Y self-reviews submitted, X of Y peer reviews submitted
- Send reminder notifications to incomplete participants
- Close cycle and trigger AI synthesis

**B2 — Self Review (Employee)**
- Structured form with 4–5 fixed questions:
  1. What were your biggest accomplishments this period?
  2. What goals did you fall short on, and why?
  3. What skills do you want to develop?
  4. How would you rate your overall performance? (1–5 with justification)
  5. What support do you need from your manager?
- Free text answers, 500-char limit per question
- Saved as draft; submitted once before deadline

**B3 — Peer Review (Employee → Colleagues)**
- Employee is assigned 2–3 peer reviewers by HR Admin
- Peer reviewer sees the reviewee's name + role, answers 3 questions:
  1. What does this person do exceptionally well?
  2. What is one area they should improve?
  3. How effectively do they collaborate with the team? (1–5)
- Reviewer names are hidden from the reviewee; HR and Manager see them

**B4 — Manager Review (Manager → Direct Reports)**
- Manager sees all their direct reports in the current cycle
- Structured form:
  1. Rate performance on key responsibilities (1–5 + comment per area)
  2. What are this employee's standout strengths?
  3. What are the most important growth areas?
  4. Is this employee on track for promotion? (Yes / Not yet / No, with justification)
  5. Overall rating: Exceeds / Meets / Below expectations

**B5 — AI Synthesis (Claude)**
- Triggered by HR Admin after deadline or when all reviews are submitted
- Claude receives: self-review, peer reviews (anonymized, names stripped), manager review
- Outputs a structured summary:
  - **Strengths paragraph** (2–3 sentences synthesizing recurring positives)
  - **Growth areas paragraph** (2–3 sentences synthesizing feedback themes)
  - **Overall narrative** (1 paragraph, balanced, professional tone)
  - **Bias flag** (if manager review language patterns differ significantly by gender/demographic — optional)
- Summary is saved and displayed to HR Admin + Manager
- HR Admin decides when to share with employee

**B6 — Employee Results View**
- After HR releases results, employee sees:
  - Their own self-review
  - The AI-synthesized summary (peer names hidden)
  - Manager's overall rating and written feedback
  - A "development focus" section derived from growth areas

**B7 — Analytics Integration**
- On the Analytics page: new "Performance" section
  - Distribution chart: how many employees are Exceeds / Meets / Below this cycle
  - Department breakdown of average ratings
  - Flagged outliers: managers whose ratings deviate significantly from peers (potential inflation/deflation)

---

### 7.3 Technology

**New DB Models needed (Prisma):**

```prisma
model PulseSurvey {
  id          String   @id @default(cuid())
  title       String
  questions   String   // JSON: [{text, type: "rating"|"text"}]
  cadence     String   // ONE_TIME | WEEKLY | BIWEEKLY | MONTHLY
  targetType  String   // ALL | DEPARTMENT
  targetId    String?  // departmentId if DEPARTMENT
  companyId   String
  createdAt   DateTime @default(now())
  endsAt      DateTime?
  active      Boolean  @default(true)
  company     Company  @relation(...)
  responses   PulseSurveyResponse[]
}

model PulseSurveyResponse {
  id        String   @id @default(cuid())
  surveyId  String
  deptId    String   // no employeeId — anonymous
  companyId String
  answers   String   // JSON: [{questionIndex, rating, comment}]
  weekOf    DateTime // Monday of the week this response belongs to
  createdAt DateTime @default(now())
  survey    PulseSurvey @relation(...)
}

model ReviewCycle {
  id          String   @id @default(cuid())
  name        String
  type        String   // SELF_ONLY | MANAGER_ONLY | THREE_SIXTY
  companyId   String
  startDate   DateTime
  deadline    DateTime
  status      String   @default("OPEN") // OPEN | CLOSED | RESULTS_SHARED
  createdAt   DateTime @default(now())
  company     Company  @relation(...)
  reviews     PerformanceReview[]
}

model PerformanceReview {
  id              String   @id @default(cuid())
  cycleId         String
  revieweeId      String   // Employee being reviewed
  reviewerId      String   // Employee doing the reviewing
  reviewerRole    String   // SELF | PEER | MANAGER
  answers         String   // JSON structured answers
  overallRating   Float?
  aiSummary       String?  // Claude-generated synthesis (on manager/HR review only)
  companyId       String
  submittedAt     DateTime?
  createdAt       DateTime @default(now())
  cycle           ReviewCycle @relation(...)
}
```

**New API Routes:**
- `POST /api/surveys` — create survey
- `GET /api/surveys` — list active surveys for current user
- `POST /api/surveys/[id]/respond` — submit anonymous response
- `GET /api/surveys/[id]/results` — aggregated heatmap data (HR/Manager only)
- `POST /api/reviews/cycles` — create review cycle
- `GET /api/reviews/cycles` — list cycles
- `POST /api/reviews/[cycleId]/submit` — submit a review
- `POST /api/reviews/[cycleId]/synthesize` — trigger Claude synthesis
- `GET /api/reviews/[cycleId]/results/[employeeId]` — get results for an employee

**New Pages:**
- `/surveys` — HR: survey list + create; Employee: active survey to fill
- `/surveys/[id]/results` — Heatmap view
- `/reviews` — Review cycle list
- `/reviews/[cycleId]` — Cycle dashboard (progress tracking)
- `/reviews/[cycleId]/submit/[type]` — Self / peer / manager review form
- `/reviews/[cycleId]/results/[employeeId]` — Results view

**AI Integration:**
- Keyword extraction for pulse free-text: lightweight Claude call, output structured JSON tags
- Review synthesis: single Claude call with all reviews as context, prompt-cached if running multiple employees in same cycle
- Bias detection (optional): Claude checks manager review text for differential language patterns

---

### 7.4 Assumptions
- Employees will respond to anonymous surveys if the UI clearly communicates anonymity (need prominent "Your response is anonymous" label)
- Companies run review cycles quarterly or annually — a simple date-range model is sufficient; no complex fiscal calendar needed
- Free-text comments in pulse surveys are optional — response rates are higher when only a rating is required
- AI synthesis quality is high enough to use without heavy human editing (assumption to validate in testing)
- Peer reviewer assignment can be manual (HR picks) for v1; auto-suggestion can come later

---

## 8. Release

### V1 — Core (Build Now)
**Pulse Survey:**
- Survey builder (HR Admin)
- Employee response form (anonymous)
- Heatmap on analytics page (avg score by dept × week)
- AI keyword extraction from free-text

**360° Reviews:**
- Review cycle creation and management (HR Admin)
- Self-review form (Employee)
- Manager review form (Manager)
- Claude AI synthesis triggered manually by HR Admin
- Results view for HR Admin + Manager
- Employee results view (after HR releases)

### V2 — Polish (Next Iteration)
- Peer review flow (requires reviewer assignment UX)
- Email/in-app reminders for incomplete submissions
- Promotion recommendation tracking
- Review cycle analytics (rating distribution charts on analytics page)
- Pulse survey scheduled auto-send

### V3 — Advanced (Future)
- Peer reviewer auto-suggestion based on collaboration graph
- Bias detection flag on manager reviews
- Year-over-year performance trend per employee
- Pulse survey benchmark comparison (vs. industry averages)
- Mobile-optimized response experience
