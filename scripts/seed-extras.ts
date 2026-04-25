/**
 * Adds sample Pulse Surveys, Review Cycles, and extra data without wiping the DB.
 * Run: DATABASE_URL=... npx tsx scripts/seed-extras.ts
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function monday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

async function main() {
  // ── Fetch existing records ────────────────────────────────────────────────
  const company = await prisma.company.findFirst()
  if (!company) throw new Error("No company found – run the main seed first")

  const employees = await prisma.employee.findMany({ where: { companyId: company.id } })
  const departments = await prisma.department.findMany({ where: { companyId: company.id } })

  const byName = (name: string) => employees.find((e) => e.name === name)!
  const deptByName = (name: string) => departments.find((d) => d.name === name)!

  const alexRivera   = byName("Alex Rivera")
  const emilyWatson  = byName("Emily Watson")
  const jordanKim    = byName("Jordan Kim")
  const davidOkafor  = byName("David Okafor")
  const sarahChen    = byName("Sarah Chen")
  const marcusJohnson = byName("Marcus Johnson")
  const rachelTorres = byName("Rachel Torres")
  const priyaSharma  = byName("Priya Sharma")
  const lisaPark     = byName("Lisa Park")
  const carlosMendez = byName("Carlos Mendez")

  const engDept  = deptByName("Engineering")
  const salesDept = deptByName("Sales")
  const opsDept  = deptByName("Operations")

  const w0 = monday(new Date("2026-04-20"))  // current week
  const w1 = monday(new Date("2026-04-13"))
  const w2 = monday(new Date("2026-04-06"))
  const w3 = monday(new Date("2026-03-30"))
  const w4 = monday(new Date("2026-03-23"))

  // ── 1. Pulse Surveys ──────────────────────────────────────────────────────
  console.log("\n── Pulse Surveys ──")

  const wellbeingSurvey = await prisma.pulseSurvey.create({
    data: {
      title: "Q2 2026 Employee Wellbeing Check-in",
      questions: JSON.stringify([
        { text: "How would you rate your work-life balance this week? (1 = terrible, 10 = perfect)", type: "rating" },
        { text: "How supported do you feel by your manager?", type: "rating" },
        { text: "What is one thing the company could do to improve your experience?", type: "text" },
      ]),
      cadence: "MONTHLY",
      targetType: "ALL",
      companyId: company.id,
      active: true,
      endsAt: new Date("2026-06-30"),
    },
  })

  const engHealthSurvey = await prisma.pulseSurvey.create({
    data: {
      title: "Engineering Team Sprint Health",
      questions: JSON.stringify([
        { text: "Rate your team collaboration this sprint (1-10)", type: "rating" },
        { text: "How manageable is your current workload?", type: "rating" },
        { text: "Are you blocked on anything? If so, describe briefly.", type: "text" },
        { text: "How clear are your sprint goals?", type: "rating" },
      ]),
      cadence: "BIWEEKLY",
      targetType: "DEPARTMENT",
      targetId: engDept.id,
      companyId: company.id,
      active: true,
      endsAt: new Date("2026-06-15"),
    },
  })

  const q1RetroSurvey = await prisma.pulseSurvey.create({
    data: {
      title: "Company-Wide Q1 Retrospective",
      questions: JSON.stringify([
        { text: "How satisfied are you with the company's direction and strategy?", type: "rating" },
        { text: "Do you feel your contributions are recognised and valued?", type: "rating" },
        { text: "How likely are you to recommend Nexus as a great place to work? (1-10)", type: "rating" },
        { text: "What is the single biggest thing leadership could improve?", type: "text" },
      ]),
      cadence: "ONE_TIME",
      targetType: "ALL",
      companyId: company.id,
      active: true,
      endsAt: new Date("2026-05-10"),
    },
  })

  console.log("Created 3 pulse surveys")

  // ── 2. Pulse Survey Responses ─────────────────────────────────────────────
  console.log("\n── Pulse Survey Responses ──")

  // Wellbeing survey – 4 weeks of responses, multiple respondents per week
  const wellbeingWeeks = [
    { weekOf: w4, responses: [
      { deptId: engDept.id,  answers: [{ questionIndex: 0, rating: 7 }, { questionIndex: 1, rating: 8 }, { questionIndex: 2, comment: "More structured 1-on-1s would help." }] },
      { deptId: salesDept.id, answers: [{ questionIndex: 0, rating: 6 }, { questionIndex: 1, rating: 7 }, { questionIndex: 2, comment: "Clearer quarterly targets earlier in the quarter." }] },
      { deptId: opsDept.id,  answers: [{ questionIndex: 0, rating: 8 }, { questionIndex: 1, rating: 9 }, { questionIndex: 2, comment: "Nothing major, team is great." }] },
    ]},
    { weekOf: w3, responses: [
      { deptId: engDept.id,  answers: [{ questionIndex: 0, rating: 6 }, { questionIndex: 1, rating: 7 }, { questionIndex: 2, comment: "Reduce back-to-back meetings to allow focus time." }] },
      { deptId: salesDept.id, answers: [{ questionIndex: 0, rating: 7 }, { questionIndex: 1, rating: 8 }, { questionIndex: 2, comment: "Better CRM tooling would save a lot of time." }] },
      { deptId: opsDept.id,  answers: [{ questionIndex: 0, rating: 9 }, { questionIndex: 1, rating: 9 }, { questionIndex: 2, comment: "Team lunches are wonderful, keep them coming!" }] },
      { deptId: engDept.id,  answers: [{ questionIndex: 0, rating: 5 }, { questionIndex: 1, rating: 6 }, { questionIndex: 2, comment: "On-call rotation is burning people out." }] },
    ]},
    { weekOf: w2, responses: [
      { deptId: engDept.id,  answers: [{ questionIndex: 0, rating: 8 }, { questionIndex: 1, rating: 8 }, { questionIndex: 2, comment: "The no-meeting Fridays policy is excellent." }] },
      { deptId: salesDept.id, answers: [{ questionIndex: 0, rating: 5 }, { questionIndex: 1, rating: 6 }, { questionIndex: 2, comment: "End-of-quarter crunch is unsustainable. Need better pipeline distribution." }] },
      { deptId: opsDept.id,  answers: [{ questionIndex: 0, rating: 7 }, { questionIndex: 1, rating: 8 }, { questionIndex: 2, comment: "More cross-team visibility into company OKRs." }] },
    ]},
    { weekOf: w1, responses: [
      { deptId: engDept.id,  answers: [{ questionIndex: 0, rating: 8 }, { questionIndex: 1, rating: 9 }, { questionIndex: 2, comment: "Very happy with the new sprint process." }] },
      { deptId: salesDept.id, answers: [{ questionIndex: 0, rating: 7 }, { questionIndex: 1, rating: 7 }, { questionIndex: 2, comment: "A dedicated sales ops analyst would be a game-changer." }] },
      { deptId: opsDept.id,  answers: [{ questionIndex: 0, rating: 8 }, { questionIndex: 1, rating: 8 }, { questionIndex: 2, comment: "Would love clearer career pathing documentation." }] },
      { deptId: engDept.id,  answers: [{ questionIndex: 0, rating: 7 }, { questionIndex: 1, rating: 8 }, { questionIndex: 2, comment: "Hackathon last month boosted morale a lot." }] },
    ]},
    { weekOf: w0, responses: [
      { deptId: engDept.id,  answers: [{ questionIndex: 0, rating: 7 }, { questionIndex: 1, rating: 8 }, { questionIndex: 2, comment: "Happy with the pace this sprint." }] },
      { deptId: salesDept.id, answers: [{ questionIndex: 0, rating: 6 }, { questionIndex: 1, rating: 7 }, { questionIndex: 2, comment: "Remote Fridays are a big quality-of-life win." }] },
      { deptId: opsDept.id,  answers: [{ questionIndex: 0, rating: 9 }, { questionIndex: 1, rating: 9 }, { questionIndex: 2, comment: "Everything is going well this week." }] },
    ]},
  ]

  for (const { weekOf, responses } of wellbeingWeeks) {
    for (const r of responses) {
      await prisma.pulseSurveyResponse.create({
        data: {
          surveyId: wellbeingSurvey.id,
          deptId: r.deptId,
          companyId: company.id,
          answers: JSON.stringify(r.answers),
          weekOf,
        },
      })
    }
  }

  // Engineering health survey – 3 sprint cycles of responses
  const engWeeks = [
    { weekOf: w4, responses: [
      { answers: [{ questionIndex: 0, rating: 7 }, { questionIndex: 1, rating: 6 }, { questionIndex: 2, comment: "Blocked on infra access for the new S3 bucket." }, { questionIndex: 3, rating: 8 }] },
      { answers: [{ questionIndex: 0, rating: 8 }, { questionIndex: 1, rating: 7 }, { questionIndex: 2, comment: "No blockers." }, { questionIndex: 3, rating: 9 }] },
      { answers: [{ questionIndex: 0, rating: 6 }, { questionIndex: 1, rating: 5 }, { questionIndex: 2, comment: "Too many context switches this sprint." }, { questionIndex: 3, rating: 7 }] },
    ]},
    { weekOf: w2, responses: [
      { answers: [{ questionIndex: 0, rating: 9 }, { questionIndex: 1, rating: 8 }, { questionIndex: 2, comment: "None – great sprint!" }, { questionIndex: 3, rating: 9 }] },
      { answers: [{ questionIndex: 0, rating: 7 }, { questionIndex: 1, rating: 7 }, { questionIndex: 2, comment: "Waiting on design assets for the dashboard." }, { questionIndex: 3, rating: 7 }] },
      { answers: [{ questionIndex: 0, rating: 8 }, { questionIndex: 1, rating: 9 }, { questionIndex: 2, comment: "All good." }, { questionIndex: 3, rating: 8 }] },
    ]},
    { weekOf: w0, responses: [
      { answers: [{ questionIndex: 0, rating: 9 }, { questionIndex: 1, rating: 7 }, { questionIndex: 2, comment: "No blockers, shipping fast." }, { questionIndex: 3, rating: 9 }] },
      { answers: [{ questionIndex: 0, rating: 8 }, { questionIndex: 1, rating: 8 }, { questionIndex: 2, comment: "Clear." }, { questionIndex: 3, rating: 9 }] },
    ]},
  ]

  for (const { weekOf, responses } of engWeeks) {
    for (const r of responses) {
      await prisma.pulseSurveyResponse.create({
        data: {
          surveyId: engHealthSurvey.id,
          deptId: engDept.id,
          companyId: company.id,
          answers: JSON.stringify(r.answers),
          weekOf,
        },
      })
    }
  }

  // Q1 Retro – single batch of responses
  const retroResponses = [
    { deptId: engDept.id,  answers: [{ questionIndex: 0, rating: 7 }, { questionIndex: 1, rating: 8 }, { questionIndex: 2, rating: 8 }, { questionIndex: 3, comment: "Invest more in developer tooling and reduce interrupt-driven work." }] },
    { deptId: salesDept.id, answers: [{ questionIndex: 0, rating: 6 }, { questionIndex: 1, rating: 6 }, { questionIndex: 2, rating: 7 }, { questionIndex: 3, comment: "Sales targets need to be set collaboratively, not top-down." }] },
    { deptId: opsDept.id,  answers: [{ questionIndex: 0, rating: 8 }, { questionIndex: 1, rating: 9 }, { questionIndex: 2, rating: 9 }, { questionIndex: 3, comment: "Keep investing in culture – it's our biggest differentiator." }] },
    { deptId: engDept.id,  answers: [{ questionIndex: 0, rating: 5 }, { questionIndex: 1, rating: 5 }, { questionIndex: 2, rating: 6 }, { questionIndex: 3, comment: "More transparency on compensation benchmarks." }] },
    { deptId: salesDept.id, answers: [{ questionIndex: 0, rating: 7 }, { questionIndex: 1, rating: 7 }, { questionIndex: 2, rating: 8 }, { questionIndex: 3, comment: "Faster product feedback loops would help us close deals faster." }] },
    { deptId: engDept.id,  answers: [{ questionIndex: 0, rating: 9 }, { questionIndex: 1, rating: 9 }, { questionIndex: 2, rating: 9 }, { questionIndex: 3, comment: "Love where we are headed. Keep the momentum." }] },
  ]

  for (const r of retroResponses) {
    await prisma.pulseSurveyResponse.create({
      data: {
        surveyId: q1RetroSurvey.id,
        deptId: r.deptId,
        companyId: company.id,
        answers: JSON.stringify(r.answers),
        weekOf: w1,
      },
    })
  }

  console.log("Created pulse survey responses (wellbeing × 5 weeks, eng × 3 sprints, retro × 6)")

  // ── 3. Review Cycles ──────────────────────────────────────────────────────
  console.log("\n── Review Cycles ──")

  // Cycle 1: Completed 360° with AI summaries
  const q1Cycle = await prisma.reviewCycle.create({
    data: {
      name: "Q1 2026 Performance Review",
      type: "THREE_SIXTY",
      companyId: company.id,
      startDate: new Date("2026-01-06"),
      deadline: new Date("2026-03-28"),
      status: "RESULTS_SHARED",
    },
  })

  // Cycle 2: Active 360° (open, partially submitted)
  const q2Cycle = await prisma.reviewCycle.create({
    data: {
      name: "Q2 2026 360° Review",
      type: "THREE_SIXTY",
      companyId: company.id,
      startDate: new Date("2026-04-01"),
      deadline: new Date("2026-06-30"),
      status: "OPEN",
    },
  })

  // Cycle 3: Active self-review
  const midYearSelf = await prisma.reviewCycle.create({
    data: {
      name: "Mid-Year Self Assessment 2026",
      type: "SELF_ONLY",
      companyId: company.id,
      startDate: new Date("2026-04-15"),
      deadline: new Date("2026-05-15"),
      status: "OPEN",
    },
  })

  console.log("Created 3 review cycles")

  // ── 4. Performance Reviews – Q1 RESULTS_SHARED ───────────────────────────
  console.log("\n── Performance Reviews (Q1 – completed) ──")

  const now = new Date("2026-04-05T10:00:00Z")

  // Helper: create a completed SELF + MANAGER review pair for one reviewee
  async function createFullReview({
    cycleId, reviewee, reviewer, selfAnswers, managerAnswers, aiSummary,
  }: {
    cycleId: string
    reviewee: { id: string }
    reviewer: { id: string }
    selfAnswers: Record<string, string | number>
    managerAnswers: Record<string, string | number>
    aiSummary: { strengths: string; growthAreas: string; narrative: string }
  }) {
    const selfReview = await prisma.performanceReview.create({
      data: {
        cycleId,
        revieweeId: reviewee.id,
        reviewerId: reviewee.id,
        reviewerRole: "SELF",
        answers: JSON.stringify(selfAnswers),
        overallRating: Number(selfAnswers.overallRating),
        aiSummary: JSON.stringify(aiSummary),
        companyId: company.id,
        submittedAt: now,
      },
    })
    await prisma.performanceReview.create({
      data: {
        cycleId,
        revieweeId: reviewee.id,
        reviewerId: reviewer.id,
        reviewerRole: "MANAGER",
        answers: JSON.stringify(managerAnswers),
        overallRating: Number(managerAnswers.overallRating),
        companyId: company.id,
        submittedAt: now,
      },
    })
    return selfReview
  }

  // Alex Rivera – Senior SWE
  await createFullReview({
    cycleId: q1Cycle.id,
    reviewee: alexRivera,
    reviewer: sarahChen,
    selfAnswers: {
      accomplishments: "Led the end-to-end implementation of the customer-facing analytics dashboard, which reduced support tickets by 30%. Mentored Jordan Kim through their onboarding and helped them ship their first production feature within six weeks.",
      shortfalls: "I underestimated the scope of the GraphQL migration and it slipped by two sprints. I should have raised the risk earlier and broken the work into smaller vertical slices.",
      development: "I want to deepen my system-design skills and take on more architectural ownership. I am also working toward improving my written communication for async-first collaboration.",
      overallRating: 4,
      managerSupport: "More clarity on quarterly priorities would help me plan technical work further ahead.",
    },
    managerAnswers: {
      strengths: "Alex is one of our most reliable engineers. He consistently delivers high-quality work, proactively unblocks teammates, and brings a calm, solutions-focused attitude to every challenge. His technical depth in TypeScript and React is exceptional.",
      growthAreas: "Alex tends to take on too much individually rather than delegating to grow others. Encouraging him to give peers more ownership will make him a stronger tech lead candidate.",
      collaboration: 5,
      overallRating: 4,
      promotionReadiness: 4,
    },
    aiSummary: {
      narrative: "Alex Rivera had a strong Q1, delivering the analytics dashboard ahead of its revised schedule and demonstrating clear ownership over both the technical and mentorship dimensions of his role. His work reduced support volume materially and set a strong quality benchmark for the team. The primary development opportunity is around proactive risk communication and distributing ownership more deliberately to accelerate the growth of junior teammates.",
      strengths: "Alex brings exceptional TypeScript and React expertise, strong reliability, and a proactive team-first mindset. His ability to mentor junior engineers while shipping complex features simultaneously is a standout quality that adds significant leverage to the engineering organisation.",
      growthAreas: "Alex should focus on earlier escalation of scope and timeline risk, and on deliberately creating ownership opportunities for peers rather than absorbing work himself. Building structured delegation habits now will position him well for a staff-level role.",
    },
  })

  // Emily Watson – SWE
  await createFullReview({
    cycleId: q1Cycle.id,
    reviewee: emilyWatson,
    reviewer: sarahChen,
    selfAnswers: {
      accomplishments: "Shipped the REST API refactor that improved p99 latency by 45%. Wrote the internal engineering onboarding guide that has been used by two new hires. Maintained 95%+ test coverage across my modules.",
      shortfalls: "I avoided taking the lead on the Redis caching project because I was unfamiliar with Redis. In hindsight I should have leaned into the challenge rather than deferring to David.",
      development: "I want to become more confident leading technical design discussions and presenting to cross-functional stakeholders.",
      overallRating: 4,
      managerSupport: "Sponsorship for an advanced Python or distributed-systems course would be very helpful.",
    },
    managerAnswers: {
      strengths: "Emily's code quality is consistently excellent and her documentation contributions have meaningfully improved team onboarding. She is deeply reliable and always follows through on commitments.",
      growthAreas: "Emily should work on stepping into unfamiliar technical territory with more confidence. She has the skills to lead larger initiatives and should start volunteering for technical lead opportunities.",
      collaboration: 4,
      overallRating: 4,
      promotionReadiness: 3,
    },
    aiSummary: {
      narrative: "Emily Watson demonstrated strong technical execution in Q1, delivering a high-impact API refactor and making lasting contributions to team documentation. Her quality standards are consistently high and she is a trusted, reliable member of the engineering team. The clearest path forward for Emily is building confidence in leading ambiguous technical challenges and cross-functional communication.",
      strengths: "Emily combines strong engineering fundamentals with excellent documentation and a high reliability quotient. Her API work had a direct, measurable impact on product performance, and her onboarding guide reflects a genuine investment in team health.",
      growthAreas: "Emily should actively seek out opportunities to lead technically unfamiliar work and to present her ideas to broader audiences. Developing comfort with ambiguity and stakeholder communication will accelerate her trajectory toward a senior role.",
    },
  })

  // Sarah Chen – Engineering Manager
  await createFullReview({
    cycleId: q1Cycle.id,
    reviewee: sarahChen,
    reviewer: sarahChen, // self only for manager – HR is reviewer in practice
    selfAnswers: {
      accomplishments: "Grew the engineering team from 3 to 5 ICs without losing velocity. Introduced bi-weekly design reviews that improved cross-team alignment. Delivered Q1 roadmap commitments at 85% on-time.",
      shortfalls: "The on-call process became inconsistent mid-quarter and caused some engineer burnout. I should have acted on the early signals faster.",
      development: "Executive presence and board-level communication. I want to be better at translating engineering progress into business impact language.",
      overallRating: 4,
      managerSupport: "Would benefit from a more structured skip-level programme with the CTO.",
    },
    managerAnswers: {
      strengths: "Sarah is an outstanding engineering manager. She has created a high-trust, high-output team culture and consistently balances technical depth with people leadership. Her ability to attract and retain strong engineers is a competitive advantage.",
      growthAreas: "Sarah should invest in executive-facing communication skills. Her work deserves more visibility at the leadership level and she would benefit from being a more prominent voice in company-wide planning.",
      collaboration: 5,
      overallRating: 5,
      promotionReadiness: 5,
    },
    aiSummary: {
      narrative: "Sarah Chen had an outstanding Q1, successfully scaling the engineering team while maintaining delivery commitments and improving team-level processes. Her leadership is a clear source of stability and performance for the engineering organisation. The primary growth edge is around executive communication — ensuring that her team's impact is as visible to leadership as it is felt internally.",
      strengths: "Sarah combines strong technical credibility with genuine people leadership. Her team-building instincts, process improvements, and ability to maintain velocity through headcount growth demonstrate a management style that is both scalable and human-centred.",
      growthAreas: "Developing executive presence and practising translating engineering outcomes into business-impact narratives will amplify Sarah's influence and positioning for Director-level responsibilities.",
    },
  })

  // Lisa Park – HR Specialist
  await createFullReview({
    cycleId: q1Cycle.id,
    reviewee: lisaPark,
    reviewer: priyaSharma,
    selfAnswers: {
      accomplishments: "Reduced time-to-hire by 18% by streamlining the interview scheduling process. Launched the employee wellness initiative with 78% participation in Q1. Processed all leave requests within SLA 100% of the time.",
      shortfalls: "I did not complete the planned benefits benchmarking project due to competing priorities. It has been pushed to Q2.",
      development: "I want to build expertise in HR analytics and people data to support more data-driven decision-making across the department.",
      overallRating: 4,
      managerSupport: "Access to an HR analytics tool or dedicated data support would unlock a lot of value.",
    },
    managerAnswers: {
      strengths: "Lisa is the operational backbone of the HR function. Her attention to detail, responsiveness, and genuine care for employees make her an invaluable team member. The wellness programme she launched is already showing measurable engagement impact.",
      growthAreas: "Lisa should develop her strategic HR skills alongside her operational strengths. Taking ownership of a project end-to-end — from insight to recommendation to execution — would accelerate her growth.",
      collaboration: 5,
      overallRating: 4,
      promotionReadiness: 3,
    },
    aiSummary: {
      narrative: "Lisa Park delivered excellent operational HR results in Q1, improving hiring efficiency and launching a well-received wellness programme. She is widely regarded as reliable, responsive, and genuinely employee-centric. Her next growth challenge is developing the strategic and analytical dimension of her HR practice to complement her operational excellence.",
      strengths: "Lisa's operational precision, stakeholder care, and programme execution are standout qualities. Her impact on time-to-hire and employee engagement reflects both process rigour and genuine human investment.",
      growthAreas: "Building HR analytics proficiency and taking on more end-to-end project ownership — from data insight through to recommendation — will prepare Lisa for a senior HR business partner role.",
    },
  })

  // Marcus Johnson – Sales Manager
  await createFullReview({
    cycleId: q1Cycle.id,
    reviewee: marcusJohnson,
    reviewer: marcusJohnson,
    selfAnswers: {
      accomplishments: "Closed $1.4M in new ARR against a $1.2M target — 117% of quota. Hired and onboarded two new SDRs. Built the sales playbook that is now used across the team.",
      shortfalls: "Enterprise deal cycle time is still too long. I need better qualification frameworks to avoid late-stage surprises.",
      development: "Formal negotiation training and improving my ability to coach reps on complex enterprise sales cycles.",
      overallRating: 5,
      managerSupport: "Budget for a sales methodology training programme (e.g., MEDDIC) for the team.",
    },
    managerAnswers: {
      strengths: "Marcus consistently over-delivers against quota and brings infectious energy to the sales floor. His ability to build trust with enterprise buyers is exceptional and his playbook has already improved team consistency.",
      growthAreas: "Marcus should focus on developing the coaching dimension of his role — helping reps build their own deal instincts rather than solving problems for them. Succession planning within his team would strengthen the overall function.",
      collaboration: 4,
      overallRating: 5,
      promotionReadiness: 5,
    },
    aiSummary: {
      narrative: "Marcus Johnson exceeded his Q1 targets by 17%, built critical team infrastructure through the sales playbook, and expanded the SDR team without sacrificing pipeline quality. He is a high-energy, high-impact sales leader whose performance speaks clearly in the numbers. The primary development focus is on becoming a stronger coach who builds independent deal-closing capability in his reps.",
      strengths: "Marcus's quota attainment, buyer relationship skills, and ability to create repeatable team processes are exceptional. His track record of over-performance combined with team-building initiatives makes him one of the company's most impactful individual contributors.",
      growthAreas: "Marcus should invest in formal sales coaching methodology and structured rep development. Distributing deal-closing capability across the team rather than centralising it in himself will de-risk the function and prepare him for VP-level leadership.",
    },
  })

  console.log("Created Q1 performance reviews with AI summaries for 5 employees")

  // ── 5. Q2 360° – partially submitted (open cycle) ─────────────────────────
  console.log("\n── Performance Reviews (Q2 – in progress) ──")

  // Alex: self submitted, manager pending
  await prisma.performanceReview.create({
    data: {
      cycleId: q2Cycle.id,
      revieweeId: alexRivera.id,
      reviewerId: alexRivera.id,
      reviewerRole: "SELF",
      answers: JSON.stringify({
        accomplishments: "Leading the new microservices migration initiative. Early results show a 20% reduction in API response times.",
        shortfalls: "Documentation lag — I ship fast but don't always write things up in time.",
        development: "Improving technical writing and knowledge-sharing practices.",
        overallRating: 4,
        managerSupport: "Would appreciate more time for pair-programming sessions.",
      }),
      overallRating: 4,
      companyId: company.id,
      submittedAt: new Date("2026-04-18"),
    },
  })
  // Manager review – draft (not submitted)
  await prisma.performanceReview.create({
    data: {
      cycleId: q2Cycle.id,
      revieweeId: alexRivera.id,
      reviewerId: sarahChen.id,
      reviewerRole: "MANAGER",
      answers: JSON.stringify({}),
      companyId: company.id,
      submittedAt: null,
    },
  })

  // Emily: self submitted
  await prisma.performanceReview.create({
    data: {
      cycleId: q2Cycle.id,
      revieweeId: emilyWatson.id,
      reviewerId: emilyWatson.id,
      reviewerRole: "SELF",
      answers: JSON.stringify({
        accomplishments: "Completed the Redis caching layer I avoided last quarter — it cut DB load by 35%. Also led a tech talk on async Python that the team found very useful.",
        shortfalls: "Still working on proactively raising design trade-offs in group discussions rather than in 1-on-1s.",
        development: "Public speaking and whiteboard system design.",
        overallRating: 4,
        managerSupport: "A design-review co-ownership opportunity would accelerate my growth.",
      }),
      overallRating: 4,
      companyId: company.id,
      submittedAt: new Date("2026-04-20"),
    },
  })
  await prisma.performanceReview.create({
    data: {
      cycleId: q2Cycle.id,
      revieweeId: emilyWatson.id,
      reviewerId: sarahChen.id,
      reviewerRole: "MANAGER",
      answers: JSON.stringify({}),
      companyId: company.id,
      submittedAt: null,
    },
  })

  // Jordan: pending both
  await prisma.performanceReview.create({
    data: {
      cycleId: q2Cycle.id,
      revieweeId: jordanKim.id,
      reviewerId: jordanKim.id,
      reviewerRole: "SELF",
      answers: JSON.stringify({}),
      companyId: company.id,
      submittedAt: null,
    },
  })
  await prisma.performanceReview.create({
    data: {
      cycleId: q2Cycle.id,
      revieweeId: jordanKim.id,
      reviewerId: sarahChen.id,
      reviewerRole: "MANAGER",
      answers: JSON.stringify({}),
      companyId: company.id,
      submittedAt: null,
    },
  })

  // Rachel Torres: self submitted
  await prisma.performanceReview.create({
    data: {
      cycleId: q2Cycle.id,
      revieweeId: rachelTorres.id,
      reviewerId: rachelTorres.id,
      reviewerRole: "SELF",
      answers: JSON.stringify({
        accomplishments: "Closed three enterprise deals worth $450K combined. Built relationships with two strategic accounts that are now expansion targets.",
        shortfalls: "Contract negotiation on the Pinnacle deal stretched four weeks longer than projected.",
        development: "Executive-level relationship building and multithreading deals across buying committees.",
        overallRating: 4,
        managerSupport: "Access to legal earlier in the negotiation process.",
      }),
      overallRating: 4,
      companyId: company.id,
      submittedAt: new Date("2026-04-22"),
    },
  })
  await prisma.performanceReview.create({
    data: {
      cycleId: q2Cycle.id,
      revieweeId: rachelTorres.id,
      reviewerId: marcusJohnson.id,
      reviewerRole: "MANAGER",
      answers: JSON.stringify({}),
      companyId: company.id,
      submittedAt: null,
    },
  })

  console.log("Created Q2 360° reviews (mix of submitted and pending)")

  // ── 6. Mid-Year Self Assessment – some submitted ──────────────────────────
  console.log("\n── Self Assessment Reviews ──")

  const selfAssessments = [
    {
      employee: davidOkafor,
      answers: {
        accomplishments: "Migrated our CI/CD pipeline to GitHub Actions, cutting average build time by 40%. Set up centralised observability with Datadog dashboards used daily by the whole engineering team.",
        shortfalls: "Kubernetes upgrade project is two weeks behind — underestimated the certificate-rotation complexity.",
        development: "Platform engineering patterns and FinOps to help the team make smarter cloud-cost decisions.",
        overallRating: 4,
        managerSupport: "A quarterly cloud budget review with leadership would give me better context for cost-optimisation decisions.",
      },
    },
    {
      employee: carlosMendez,
      answers: {
        accomplishments: "Delivered the annual budget model two weeks early, allowing leadership to reallocate $200K to growth initiatives. Built automated variance reports that save 6 hours per month.",
        shortfalls: "The vendor cost analysis had a modelling error that required correction — I should have had a second pair of eyes on it.",
        development: "FP&A storytelling and data visualisation to make financial insights more actionable for non-finance stakeholders.",
        overallRating: 3,
        managerSupport: "More collaboration time with product to understand the business drivers behind the numbers.",
      },
    },
    {
      employee: lisaPark,
      answers: {
        accomplishments: "Launched the benefits benchmarking project (pushed from Q1). Completed HR analytics certification. Reduced onboarding paperwork by 60% by moving to digital forms.",
        shortfalls: "Recruiting pipeline for the DevOps role is taking longer than expected — sourcing strategy needs adjustment.",
        development: "People analytics and predictive attrition modelling using HR data.",
        overallRating: 4,
        managerSupport: "Budget for an HRIS upgrade would significantly reduce manual administrative work.",
      },
    },
  ]

  for (const { employee, answers } of selfAssessments) {
    await prisma.performanceReview.create({
      data: {
        cycleId: midYearSelf.id,
        revieweeId: employee.id,
        reviewerId: employee.id,
        reviewerRole: "SELF",
        answers: JSON.stringify(answers),
        overallRating: Number(answers.overallRating),
        companyId: company.id,
        submittedAt: new Date("2026-04-23"),
      },
    })
  }

  // Remaining employees – pending
  const pending = [alexRivera, emilyWatson, jordanKim, sarahChen, marcusJohnson, rachelTorres, priyaSharma]
  for (const emp of pending) {
    await prisma.performanceReview.create({
      data: {
        cycleId: midYearSelf.id,
        revieweeId: emp.id,
        reviewerId: emp.id,
        reviewerRole: "SELF",
        answers: JSON.stringify({}),
        companyId: company.id,
        submittedAt: null,
      },
    })
  }

  console.log(`Created mid-year self assessments (3 submitted, ${pending.length} pending)`)

  // ── 7. More Tickets (PolicyBot) ───────────────────────────────────────────
  console.log("\n── PolicyBot Tickets ──")

  const extraTickets = [
    {
      employee: emilyWatson,
      question: "Can I carry over unused annual leave from 2026 into 2027? I have about 8 days remaining and am not sure how many I can keep.",
      aiAnswer: "Under the current leave policy, you can carry over a maximum of 5 annual leave days into the next year. Any unused days above that limit will be forfeited at year end. Based on your 8 remaining days, you would retain 5 and forfeit 3 if you do not use them before December 31st. I would recommend submitting leave requests for at least 3 days before year end to avoid losing them.",
      escalated: false,
      resolved: true,
    },
    {
      employee: jordanKim,
      question: "I started 8 months ago. Am I eligible for the work-from-home stipend and the hybrid schedule?",
      aiAnswer: "Yes, you are eligible. The WFH policy requires a minimum of 3 months tenure, which you have exceeded. You are entitled to the hybrid model (minimum 2 days in office per week, typically Tuesday and Thursday). You also qualify for the one-time $500 home office stipend and the $50/month internet stipend since you will be working remote 3+ days per week. Please submit a WFH arrangement request to HR to formalise this.",
      escalated: false,
      resolved: true,
    },
    {
      employee: rachelTorres,
      question: "My manager passed over me for a high-visibility account and gave it to a newer colleague. I feel this was unfair given my track record. What are my options?",
      aiAnswer: "I understand this is a frustrating situation. While account assignments are generally a manager's discretion, you have the right to raise your concerns through the appropriate channels. I recommend first requesting a 1-on-1 with your manager to understand the rationale and share your perspective constructively. If you remain unsatisfied, you can escalate to HR for a neutral conversation. If you believe the decision was influenced by a protected characteristic, that would constitute a potential policy violation and I am escalating this ticket for HR review.",
      escalated: true,
      resolved: false,
    },
    {
      employee: davidOkafor,
      question: "What is the company policy on using personal devices for work when travelling internationally?",
      aiAnswer: "The company requires that all work be performed on company-issued laptops. When travelling internationally, you must use a VPN at all times when accessing company systems — this is mandatory, not optional. Do not perform work on personal devices as this creates data security risks outside company-managed endpoints. If your company laptop is lost or stolen while travelling, report it to IT Security immediately. The company recommends enabling full-disk encryption and a short auto-lock timer (5 minutes per policy) before any international travel.",
      escalated: false,
      resolved: true,
    },
    {
      employee: carlosMendez,
      question: "I need to take 2 weeks of unpaid leave in July for a family matter. Is that allowed, and what is the process?",
      aiAnswer: "Unpaid leave is available in exceptional circumstances under the leave policy, with a maximum of 3 months per year. Two weeks would be well within that limit. You will need to submit a request through the HireFlow portal, which will go to your manager for approval and then to HR. Both your manager and the department head must approve it. I would recommend submitting the request as soon as possible to allow adequate planning time. If approved, your regular benefits continue during the unpaid leave period.",
      escalated: false,
      resolved: false,
    },
  ]

  for (const t of extraTickets) {
    await prisma.ticket.create({
      data: {
        employeeId: t.employee.id,
        question: t.question,
        aiAnswer: t.aiAnswer,
        escalated: t.escalated,
        resolved: t.resolved,
        companyId: company.id,
      },
    })
  }

  console.log("Created 5 additional PolicyBot tickets")

  // ── 8. AI Call Logs (AgentOps) ────────────────────────────────────────────
  console.log("\n── AI Call Logs ──")

  const aiLogs = [
    { agentName: "resume-screener",      inputTokens: 1240, outputTokens: 380, latencyMs: 1820, costUsd: 0.0062 },
    { agentName: "resume-screener",      inputTokens: 980,  outputTokens: 310, latencyMs: 1540, costUsd: 0.0049 },
    { agentName: "resume-screener",      inputTokens: 1450, outputTokens: 420, latencyMs: 2100, costUsd: 0.0073 },
    { agentName: "resume-screener",      inputTokens: 870,  outputTokens: 290, latencyMs: 1380, costUsd: 0.0044 },
    { agentName: "resume-screener",      inputTokens: 1100, outputTokens: 350, latencyMs: 1660, costUsd: 0.0055 },
    { agentName: "bias-detector",        inputTokens: 560,  outputTokens: 180, latencyMs: 980,  costUsd: 0.0028 },
    { agentName: "bias-detector",        inputTokens: 620,  outputTokens: 200, latencyMs: 1040, costUsd: 0.0031 },
    { agentName: "bias-detector",        inputTokens: 490,  outputTokens: 160, latencyMs: 880,  costUsd: 0.0025 },
    { agentName: "policybot",            inputTokens: 2100, outputTokens: 520, latencyMs: 2480, costUsd: 0.0105 },
    { agentName: "policybot",            inputTokens: 1890, outputTokens: 480, latencyMs: 2240, costUsd: 0.0095 },
    { agentName: "policybot",            inputTokens: 2340, outputTokens: 590, latencyMs: 2760, costUsd: 0.0117 },
    { agentName: "policybot",            inputTokens: 1750, outputTokens: 445, latencyMs: 2080, costUsd: 0.0088 },
    { agentName: "policybot",            inputTokens: 1980, outputTokens: 510, latencyMs: 2350, costUsd: 0.0099 },
    { agentName: "review-synthesizer",   inputTokens: 3200, outputTokens: 410, latencyMs: 3100, costUsd: 0.0160 },
    { agentName: "review-synthesizer",   inputTokens: 2980, outputTokens: 395, latencyMs: 2940, costUsd: 0.0149 },
    { agentName: "review-synthesizer",   inputTokens: 3450, outputTokens: 430, latencyMs: 3320, costUsd: 0.0173 },
    { agentName: "review-synthesizer",   inputTokens: 3100, outputTokens: 405, latencyMs: 3040, costUsd: 0.0155 },
    { agentName: "review-synthesizer",   inputTokens: 2850, outputTokens: 385, latencyMs: 2800, costUsd: 0.0143 },
    { agentName: "analytics-narrator",   inputTokens: 1600, outputTokens: 320, latencyMs: 1740, costUsd: 0.0080 },
    { agentName: "analytics-narrator",   inputTokens: 1450, outputTokens: 295, latencyMs: 1580, costUsd: 0.0073 },
    { agentName: "survey-insight",       inputTokens: 1800, outputTokens: 360, latencyMs: 1920, costUsd: 0.0090 },
    { agentName: "survey-insight",       inputTokens: 1650, outputTokens: 330, latencyMs: 1780, costUsd: 0.0083 },
  ]

  const baseDate = new Date("2026-04-01T09:00:00Z")
  for (let i = 0; i < aiLogs.length; i++) {
    const log = aiLogs[i]
    const createdAt = new Date(baseDate.getTime() + i * 3 * 60 * 60 * 1000) // spread over days
    await prisma.aiCallLog.create({
      data: {
        agentName: log.agentName,
        prompt: `[sample prompt for ${log.agentName}]`,
        response: `[sample response for ${log.agentName}]`,
        inputTokens: log.inputTokens,
        outputTokens: log.outputTokens,
        latencyMs: log.latencyMs,
        costUsd: log.costUsd,
        companyId: company.id,
        createdAt,
      },
    })
  }

  console.log(`Created ${aiLogs.length} AI call logs across 6 agents`)

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(55))
  console.log("Sample data seeded successfully!")
  console.log("=".repeat(55))
  console.log("\nPulse Surveys (3):")
  console.log("  · Q2 2026 Employee Wellbeing Check-in  (MONTHLY, ALL)")
  console.log("  · Engineering Team Sprint Health        (BIWEEKLY, Eng dept)")
  console.log("  · Company-Wide Q1 Retrospective         (ONE_TIME, ALL)")
  console.log("\nReview Cycles (3):")
  console.log("  · Q1 2026 Performance Review            (RESULTS_SHARED, 360°)")
  console.log("    → Alex, Emily, Sarah, Lisa, Marcus — full reviews + AI summaries")
  console.log("  · Q2 2026 360° Review                   (OPEN — partial submissions)")
  console.log("  · Mid-Year Self Assessment 2026         (OPEN — 3 submitted, 7 pending)")
  console.log("\nPolicyBot Tickets: +5 new tickets (1 escalated)")
  console.log(`AI Call Logs: +${aiLogs.length} logs across 6 agents`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
