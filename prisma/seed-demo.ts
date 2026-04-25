/**
 * Demo data seed: fills pulse surveys (3 weeks of dept responses)
 * and a full 360° review cycle (self + manager reviews for all employees)
 * then triggers Claude AI synthesis for each.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { synthesizeReviews } from '../lib/ai/reviews'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  // ── IDs from DB ──────────────────────────────────────────────────────────────
  const company = await prisma.company.findFirst()
  if (!company) throw new Error('No company found — run the main seed first')
  const cid = company.id

  const ENG  = 'cmodb0x4x0001n53r93q50nn3'
  const SALES = 'cmodb0xa10002n53r486xtcbo'
  const OPS  = 'cmodb0xg70003n53ratiuyops'

  const SARAH  = 'cmodb0xl40004n53rjkjvtqj2' // Engineering Manager
  const MARCUS = 'cmodb0xov0005n53rfpcm252l' // Sales Manager
  const PRIYA  = 'cmodb0xsp0006n53rmkm15j0d' // Operations Manager
  const ALEX   = 'cmodb0y1v0007n53r7v6m67oa' // Senior SWE → mgr Sarah
  const EMILY  = 'cmodb0y8r0008n53riwk44z4c' // SWE → mgr Sarah
  const JORDAN = 'cmodb0ycm0009n53r6gn9fiiu' // Junior SWE → mgr Sarah
  const DAVID  = 'cmodb0yga000an53rpito87k5' // DevOps → mgr Sarah
  const RACHEL = 'cmodb0ylb000bn53rjm2ouh4y' // Account Exec → mgr Marcus
  const TOM    = 'cmodb0yq2000cn53ry1iwxmsw' // SDR → mgr Marcus
  const AISHA  = 'cmodb0z3s000fn53rfl6btb3d' // Office Admin → mgr Priya
  const CARLOS = 'cmodb0yzx000en53ruh7i8zls' // Finance Analyst → mgr Priya
  const LISA   = 'cmodb0yw4000dn53rujprf9m3' // HR Specialist → mgr Priya

  // ── Helper: Monday of a week N weeks ago ────────────────────────────────────
  function mondayWeeksAgo(n: number): Date {
    const d = new Date()
    const day = d.getDay()
    d.setDate(d.getDate() - ((day + 6) % 7) - n * 7)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 1. PULSE SURVEY
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── Creating pulse survey ──')

  // Remove existing surveys to avoid duplicates
  await prisma.pulseSurveyResponse.deleteMany({ where: { companyId: cid } })
  await prisma.pulseSurvey.deleteMany({ where: { companyId: cid } })

  const survey = await prisma.pulseSurvey.create({
    data: {
      title: 'Weekly Team Pulse',
      questions: JSON.stringify([
        { text: 'How satisfied are you with your work this week?', type: 'rating' },
        { text: 'Anything on your mind you\'d like to share? (optional)', type: 'text' },
      ]),
      cadence: 'WEEKLY',
      targetType: 'ALL',
      companyId: cid,
      active: true,
    },
  })
  console.log('  Survey created:', survey.title)

  // 3 weeks of responses — ratings & comments vary per dept/week to make the
  // heatmap interesting with a visible trend
  const weeklyData = [
    // week 3 ago — baseline
    {
      weekOf: mondayWeeksAgo(3),
      depts: [
        { deptId: ENG,   rating: 7, comment: 'Solid sprint but context-switching is high' },
        { deptId: ENG,   rating: 8, comment: 'Good collaboration this week' },
        { deptId: ENG,   rating: 6, comment: 'Unclear priorities from product' },
        { deptId: SALES, rating: 8, comment: 'Strong pipeline week' },
        { deptId: SALES, rating: 7, comment: 'Quota pressure is building' },
        { deptId: OPS,   rating: 7, comment: 'Steady week, nothing major' },
        { deptId: OPS,   rating: 6, comment: 'Vendor issues causing delays' },
      ],
    },
    // week 2 ago — morale dip in engineering
    {
      weekOf: mondayWeeksAgo(2),
      depts: [
        { deptId: ENG,   rating: 5, comment: 'Too many meetings, hard to focus on deep work' },
        { deptId: ENG,   rating: 4, comment: 'Workload is unsustainable, need better scoping' },
        { deptId: ENG,   rating: 6, comment: 'Deployment issues added stress' },
        { deptId: SALES, rating: 9, comment: 'Closed two big deals, team energy is great' },
        { deptId: SALES, rating: 8, comment: 'Great support from marketing this week' },
        { deptId: OPS,   rating: 5, comment: 'Understaffed this week, feeling the strain' },
        { deptId: OPS,   rating: 7, comment: '' },
      ],
    },
    // last week — recovery in engineering, ops dip
    {
      weekOf: mondayWeeksAgo(1),
      depts: [
        { deptId: ENG,   rating: 8, comment: 'No-meeting day on Wednesday made a huge difference' },
        { deptId: ENG,   rating: 9, comment: 'Shipped the new auth module, team is proud' },
        { deptId: ENG,   rating: 7, comment: 'Better sprint planning this week' },
        { deptId: SALES, rating: 7, comment: 'End of quarter pressure, but manageable' },
        { deptId: SALES, rating: 6, comment: 'Need more marketing collateral' },
        { deptId: OPS,   rating: 4, comment: 'Two team members out sick, very stretched' },
        { deptId: OPS,   rating: 5, comment: 'Would appreciate more recognition for ops work' },
        { deptId: OPS,   rating: 6, comment: 'Process improvements are helping somewhat' },
      ],
    },
  ]

  for (const week of weeklyData) {
    for (const r of week.depts) {
      await prisma.pulseSurveyResponse.create({
        data: {
          surveyId: survey.id,
          deptId: r.deptId,
          companyId: cid,
          weekOf: week.weekOf,
          answers: JSON.stringify([
            { questionIndex: 0, rating: r.rating },
            { questionIndex: 1, comment: r.comment },
          ]),
        },
      })
    }
  }
  console.log('  Responses seeded across 3 weeks ✓')

  // ════════════════════════════════════════════════════════════════════════════
  // 2. REVIEW CYCLE
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n── Creating Q2 2025 review cycle ──')

  // Clean up existing reviews/cycles for this company
  await prisma.performanceReview.deleteMany({ where: { companyId: cid } })
  await prisma.reviewCycle.deleteMany({ where: { companyId: cid } })

  const cycle = await prisma.reviewCycle.create({
    data: {
      name: 'Q2 2025 Performance Review',
      type: 'THREE_SIXTY',
      companyId: cid,
      startDate: new Date('2025-04-01'),
      deadline: new Date('2025-04-30'),
      status: 'OPEN',
    },
  })
  console.log('  Cycle created:', cycle.name)

  // ── Self-review answers per employee ───────────────────────────────────────
  const selfReviews: Record<string, {
    accomplishments: string
    shortfalls: string
    development: string
    overallRating: number
    managerSupport: string
  }> = {
    [ALEX]: {
      accomplishments: 'Led the full migration of our authentication service to OAuth 2.0 — shipped on time and zero production incidents. Reduced core API latency by 32% through query optimization and connection pooling. Mentored Emily and Jordan on TypeScript generics and testing patterns, which measurably cut their PR turnaround time.',
      shortfalls: "The mobile app refactor I committed to at the start of Q1 is still incomplete. I underestimated the scope of legacy dependencies and didn't surface the blocker early enough. Should have re-scoped and communicated sooner rather than silently slipping.",
      development: 'Want to deepen my knowledge of distributed systems design — specifically consensus algorithms and event-driven architecture. Also want to improve my technical writing to produce better architecture decision records.',
      overallRating: 4,
      managerSupport: 'More upfront architectural context when new initiatives kick off would help me plan more accurately. A 30-min kickoff walkthrough for each project would save days of discovery.',
    },
    [EMILY]: {
      accomplishments: 'Delivered all four assigned features in Q1 on schedule, with test coverage above 85% on each. Took ownership of the onboarding documentation for new engineers and rewrote three outdated runbooks. Proactively caught and fixed a data race in the payments module before it reached production.',
      shortfalls: "My code review turnaround time is inconsistent — sometimes blocking teammates for 2+ days. I've been prioritizing my own output over review throughput, which I know has a team-level cost.",
      development: "Backend architecture and system design are my main growth areas. I'd like to lead a cross-functional project end-to-end next quarter to build that muscle. Also want to get more comfortable with data modeling for complex domains.",
      overallRating: 3,
      managerSupport: 'Would love more structured feedback during 1-on-1s rather than just status updates. Knowing specifically where I stand vs. senior level expectations would help me close gaps faster.',
    },
    [JORDAN]: {
      accomplishments: 'First full quarter at Nexus — shipped 3 features independently after the initial onboarding period. Got comfortable with the codebase faster than expected and am now reviewing PRs from other juniors. Built a small internal CLI tool to streamline the local dev setup that the team has adopted.',
      shortfalls: "Still learning the code review culture — my reviews are sometimes too surface-level and miss architectural issues. Also need to get better at writing clear PR descriptions so reviewers don't have to ask for context.",
      development: 'TypeScript generics and advanced patterns, system design fundamentals, and learning how to give more substantive code reviews. Want to work toward a mid-level transition by end of year.',
      overallRating: 3,
      managerSupport: 'Regular pairing sessions with senior engineers would accelerate my growth significantly. Even 1 hour a week would make a big difference.',
    },
    [DAVID]: {
      accomplishments: 'Rebuilt our CI/CD pipeline from scratch — deployment time dropped from 22 minutes to 6 minutes. Set up environment parity between staging and production which eliminated an entire class of "works on my machine" bugs. Also implemented automated rollback triggers that caught a bad deploy in Q1 before it impacted users.',
      shortfalls: 'Documentation for the new infrastructure is still incomplete. I tend to build first and document later, which creates knowledge silos. The on-call runbooks are especially out of date.',
      development: 'Kubernetes multi-cluster management and cloud cost optimization. Want to lead a FinOps initiative to reduce our AWS spend. Also interested in getting deeper into platform engineering.',
      overallRating: 4,
      managerSupport: "Would benefit from more clarity on infrastructure priorities vs. feature team requests — there's often competing pressure. A written priority framework would help me push back constructively.",
    },
    [RACHEL]: {
      accomplishments: "Exceeded quota by 18% — closed $1.2M in new ARR including two enterprise logos we'd been pursuing for 6 months. Built and executed a land-and-expand playbook for one of our new verticals. Maintained a CSAT score of 4.8/5 across all new accounts through Q1.",
      shortfalls: "CRM hygiene has slipped — activity logging is inconsistent and pipeline data isn't always up to date. This has made forecasting harder for Marcus and the leadership team. It's a discipline issue I'm actively working on.",
      development: 'Want to develop stronger enterprise negotiation skills and learn more about structuring multi-year deals. Also interested in eventually transitioning into a sales leadership role and want to start building those skills now.',
      overallRating: 5,
      managerSupport: 'More deal coaching on complex enterprise negotiations would be valuable — bringing in a senior leader for key calls would help me close faster.',
    },
    [TOM]: {
      accomplishments: 'Hit outbound targets for all 13 weeks of Q1 — averaged 80 touches/week and scheduled 47 demos. Improved my email open rate from 22% to 38% through A/B testing subject lines. Helped onboard and shadow two new SDRs during the quarter.',
      shortfalls: "Demo-to-opportunity conversion rate is at 28% vs. the 35% team target. Some demos aren't qualifying prospects tightly enough before booking, leading to low-quality pipeline. I need to be more rigorous on fit criteria.",
      development: 'Objection handling and consultative discovery are my main focus areas. Also want to deepen my product knowledge so I can speak more credibly to technical buyers.',
      overallRating: 3,
      managerSupport: 'More structured call coaching with recorded playback would help me self-identify patterns. Even bi-weekly call reviews would be high-leverage.',
    },
    [AISHA]: {
      accomplishments: 'Organised the company offsite for 45 people end-to-end — zero incidents, strong feedback. Redesigned the new hire onboarding checklist which reduced average time-to-productive from 3 weeks to 10 days. Renegotiated two office vendor contracts, saving approximately $8K annually.',
      shortfalls: "Vendor management is still somewhat reactive — I respond to issues well but don't always anticipate them. Want to build more proactive SLA tracking so problems surface before they escalate.",
      development: 'Project management methodology (PMP or equivalent) and vendor negotiation strategy. Would also like to develop skills in facilities analytics and workplace design.',
      overallRating: 4,
      managerSupport: 'Greater visibility into headcount planning would help me prepare office capacity and resources earlier. Even a 30-day heads-up on planned hires makes a big operational difference.',
    },
    [CARLOS]: {
      accomplishments: 'Produced Q1 financial reports two days ahead of schedule for the first time. Implemented a new budget tracking dashboard in Google Sheets that Finance and department heads now use weekly. Supported the audit prep process and resolved 3 discrepancies that would have required significant rework.',
      shortfalls: 'Forecasting accuracy was off by 12% in Q1 — underestimated variable expenses in Engineering. Need to build better models that account for headcount-driven spend spikes.',
      development: 'Financial modelling in Excel and Python, and data visualisation using Tableau or Looker. Want to move from descriptive to predictive financial reporting.',
      overallRating: 3,
      managerSupport: 'More context on business decisions that have financial implications would help me model more accurately. Earlier visibility into planned spend would significantly improve forecast quality.',
    },
    [LISA]: {
      accomplishments: 'Ran end-to-end hiring for 5 roles in Q1, reducing average time-to-offer from 38 days to 24 days. Launched the first structured employee onboarding programme with role-specific tracks. Set up the HRIS module for leave management which eliminated the manual spreadsheet process.',
      shortfalls: "The Q1 employee engagement survey had only 62% completion — below the 80% target. The survey was sent at a busy time and I didn't follow up adequately. Plan to build a structured nudge schedule next cycle.",
      development: 'HR analytics and people data interpretation. Want to build dashboards that let leadership make data-driven workforce decisions. Also interested in compensation benchmarking and pay equity analysis.',
      overallRating: 4,
      managerSupport: 'Strategic HR is an area I want to grow into — regular conversations with senior leadership about people strategy (not just operations) would accelerate that.',
    },
  }

  // ── Manager review answers ─────────────────────────────────────────────────
  type MgrReview = {
    strengths: string
    growthAreas: string
    collaboration: number
    overallRating: number
    promotionReadiness: number
  }

  const managerReviews: Record<string, { reviewerId: string; answers: MgrReview }> = {
    [ALEX]: {
      reviewerId: SARAH,
      answers: {
        strengths: "Alex is one of the strongest technical contributors on the team. The OAuth migration was executed flawlessly under time pressure — zero production incidents is a real achievement. His mentorship of junior engineers has had a measurable uplift on the team's quality bar and review culture.",
        growthAreas: 'Estimation accuracy is the primary growth area. Alex tends to undercommit on scope discovery and then silently absorbs overruns. Needs to escalate blockers earlier and reforecast openly rather than heroically overworking to meet original timelines.',
        collaboration: 5,
        overallRating: 4,
        promotionReadiness: 3,
      },
    },
    [EMILY]: {
      reviewerId: SARAH,
      answers: {
        strengths: 'Emily is a reliable, high-quality contributor. Her test coverage discipline is the best on the team and has caught several regressions before they reached production. The proactive fix on the payments data race demonstrated strong ownership instincts.',
        growthAreas: 'Code review responsiveness needs improvement — being a bottleneck for other engineers has a compounding team cost. Emily should timebox reviews the same way she timeboxes her own implementation work. Could also be more vocal in architectural discussions.',
        collaboration: 4,
        overallRating: 3,
        promotionReadiness: 2,
      },
    },
    [JORDAN]: {
      reviewerId: SARAH,
      answers: {
        strengths: "Jordan has ramped faster than any junior I've managed in recent memory. The internal CLI tool they shipped unprompted shows real initiative — it's now used by the whole team. Eager, receptive to feedback, and has a good instinct for developer experience.",
        growthAreas: "Review quality needs to deepen significantly — Jordan is pattern-matching syntax rather than reasoning about design. This is expected at this stage, but it's the main thing holding back a mid-level conversation. Needs more deliberate exposure to system design thinking.",
        collaboration: 4,
        overallRating: 3,
        promotionReadiness: 1,
      },
    },
    [DAVID]: {
      reviewerId: SARAH,
      answers: {
        strengths: "David's infrastructure work has had outsized impact on team velocity. The CI/CD rebuild alone saved the engineering team roughly 100 hours of waiting time per month. His on-call discipline is excellent — he's never left an incident without a written retrospective.",
        growthAreas: "Documentation is the clear gap. David builds excellent systems that become knowledge silos because he doesn't write things down. Runbooks, architecture diagrams, and decision records need to be treated as deliverables, not afterthoughts.",
        collaboration: 4,
        overallRating: 4,
        promotionReadiness: 3,
      },
    },
    [RACHEL]: {
      reviewerId: MARCUS,
      answers: {
        strengths: 'Rachel is the top performer on the sales team by every metric that matters. Her ability to build trust with enterprise buyers over a long sales cycle is exceptional — the two logos she closed had 9-month cycles. Her CSAT scores reflect genuine relationship depth, not just process compliance.',
        growthAreas: "CRM hygiene is the one clear gap and it's significant because it creates forecasting blind spots for leadership. Rachel needs to treat data entry as a core job responsibility, not an administrative afterthought. This is the only thing standing between her and a senior AE conversation.",
        collaboration: 5,
        overallRating: 5,
        promotionReadiness: 4,
      },
    },
    [TOM]: {
      reviewerId: MARCUS,
      answers: {
        strengths: "Tom is consistent and coachable — he hits his outbound targets every week without fail. The improvement in email open rates shows he's thinking analytically about his craft, not just running plays mechanically. His willingness to shadow and support new SDRs is a great sign for leadership potential.",
        growthAreas: "Discovery quality needs significant improvement. Too many booked demos aren't translating because the qualification bar is too low. Tom needs to learn to say no to weak prospects upfront — short-term pipeline looks better but long-term win rate suffers. Structured objection handling training is the priority.",
        collaboration: 4,
        overallRating: 3,
        promotionReadiness: 2,
      },
    },
    [AISHA]: {
      reviewerId: PRIYA,
      answers: {
        strengths: "Aisha's execution on the company offsite was best-in-class — she managed vendors, logistics, and 45 people without dropping a single ball. The new hire onboarding redesign has had a tangible business impact. She brings a calm, dependable presence to the operations function.",
        growthAreas: "Aisha operates very reactively — she's excellent at solving problems but doesn't yet anticipate them. Moving from reactive to proactive vendor management is the key growth edge. She should be running quarterly SLA reviews and flagging risks before they escalate to me.",
        collaboration: 5,
        overallRating: 4,
        promotionReadiness: 3,
      },
    },
    [CARLOS]: {
      reviewerId: PRIYA,
      answers: {
        strengths: "Carlos is technically strong and analytically rigorous. The budget dashboard he built is genuinely used and referenced by the leadership team every week — that's a meaningful contribution. His audit prep work was careful and thorough.",
        growthAreas: 'Forecasting accuracy needs significant improvement — 12% off on variable expenses is a real problem for planning. Carlos needs to build models that account for headcount-driven spend patterns and engage more proactively with department heads to gather forward-looking inputs.',
        collaboration: 3,
        overallRating: 3,
        promotionReadiness: 2,
      },
    },
    [LISA]: {
      reviewerId: PRIYA,
      answers: {
        strengths: 'Lisa has transformed the HR function from reactive administration to something approaching a strategic capability. Cutting time-to-offer by 14 days is a significant competitive advantage. The HRIS implementation was managed smoothly with minimal disruption to employees.',
        growthAreas: 'The engagement survey completion rate reflects a gap in internal communications and follow-through. Lisa needs to build more structured nudge campaigns and create genuine two-way dialogue — employees need to see that survey responses lead to action, not just data collection.',
        collaboration: 4,
        overallRating: 4,
        promotionReadiness: 3,
      },
    },
  }

  // ── Create all review stubs and submit them ────────────────────────────────
  const reportees = [ALEX, EMILY, JORDAN, DAVID, RACHEL, TOM, AISHA, CARLOS, LISA]
  const managerMap: Record<string, string> = {
    [ALEX]: SARAH, [EMILY]: SARAH, [JORDAN]: SARAH, [DAVID]: SARAH,
    [RACHEL]: MARCUS, [TOM]: MARCUS,
    [AISHA]: PRIYA, [CARLOS]: PRIYA, [LISA]: PRIYA,
  }

  let selfCount = 0, mgrCount = 0

  for (const empId of reportees) {
    const self = selfReviews[empId]
    if (!self) continue

    // Self review
    const selfRecord = await prisma.performanceReview.create({
      data: {
        cycleId: cycle.id,
        revieweeId: empId,
        reviewerId: empId,
        reviewerRole: 'SELF',
        companyId: cid,
        answers: JSON.stringify({
          accomplishments: self.accomplishments,
          shortfalls: self.shortfalls,
          development: self.development,
          managerSupport: self.managerSupport,
        }),
        overallRating: self.overallRating,
        submittedAt: new Date(),
      },
    })
    selfCount++

    // Manager review
    const mgr = managerReviews[empId]
    if (!mgr) continue

    await prisma.performanceReview.create({
      data: {
        cycleId: cycle.id,
        revieweeId: empId,
        reviewerId: mgr.reviewerId,
        reviewerRole: 'MANAGER',
        companyId: cid,
        answers: JSON.stringify(mgr.answers),
        overallRating: mgr.answers.overallRating,
        submittedAt: new Date(),
      },
    })
    mgrCount++

    // ── AI synthesis ──────────────────────────────────────────────────────────
    const emp = await prisma.employee.findUnique({
      where: { id: empId },
      select: { name: true, title: true },
    })
    if (!emp) continue

    process.stdout.write(`  Synthesizing ${emp.name}... `)
    try {
      const synthesis = await synthesizeReviews(
        emp.name,
        emp.title,
        [
          { role: 'SELF', answers: { ...self }, overallRating: self.overallRating },
          { role: 'MANAGER', answers: { ...mgr.answers }, overallRating: mgr.answers.overallRating },
        ],
        cid
      )
      await prisma.performanceReview.update({
        where: { id: selfRecord.id },
        data: { aiSummary: JSON.stringify(synthesis) },
      })
      console.log('✓')
    } catch (e) {
      console.log('⚠ AI error:', (e as Error).message ?? e)
    }
  }

  console.log(`\n  Self-reviews:    ${selfCount}`)
  console.log(`  Manager reviews: ${mgrCount}`)

  await prisma.$disconnect()
  console.log('\n✅ All demo data seeded successfully!')
}

main().catch((e) => { console.error(e); process.exit(1) })
