import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.aiCallLog.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.leaveBalance.deleteMany()
  await prisma.leaveRequest.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.candidate.deleteMany()
  await prisma.job.deleteMany()
  await prisma.policyDocument.deleteMany()
  await prisma.user.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.department.deleteMany()
  await prisma.company.deleteMany()

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'Nexus Technologies',
      domain: 'nexus.tech',
    }
  })
  console.log('Created company:', company.name)

  // Create departments
  const engineering = await prisma.department.create({
    data: { name: 'Engineering', companyId: company.id }
  })
  const sales = await prisma.department.create({
    data: { name: 'Sales', companyId: company.id }
  })
  const operations = await prisma.department.create({
    data: { name: 'Operations', companyId: company.id }
  })
  console.log('Created departments: Engineering, Sales, Operations')

  // Create employees (12 total)
  // Engineering manager first (no managerId)
  const engManager = await prisma.employee.create({
    data: {
      name: 'Sarah Chen',
      email: 'sarah.chen@nexus.tech',
      title: 'Engineering Manager',
      departmentId: engineering.id,
      companyId: company.id,
      location: 'San Francisco, CA',
      skills: JSON.stringify(['TypeScript', 'Node.js', 'System Design', 'React', 'AWS']),
      hireDate: new Date('2020-03-15'),
      status: 'ACTIVE',
      gender: 'Female',
    }
  })

  const salesManager = await prisma.employee.create({
    data: {
      name: 'Marcus Johnson',
      email: 'marcus.johnson@nexus.tech',
      title: 'Sales Manager',
      departmentId: sales.id,
      companyId: company.id,
      location: 'New York, NY',
      skills: JSON.stringify(['CRM', 'Salesforce', 'Negotiation', 'Lead Generation', 'Account Management']),
      hireDate: new Date('2019-07-01'),
      status: 'ACTIVE',
      gender: 'Male',
    }
  })

  const opsManager = await prisma.employee.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya.sharma@nexus.tech',
      title: 'Operations Manager',
      departmentId: operations.id,
      companyId: company.id,
      location: 'Austin, TX',
      skills: JSON.stringify(['Project Management', 'Process Improvement', 'JIRA', 'Agile', 'Risk Management']),
      hireDate: new Date('2018-11-20'),
      status: 'ACTIVE',
      gender: 'Female',
    }
  })

  // Engineering team members
  const emp1 = await prisma.employee.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex.rivera@nexus.tech',
      title: 'Senior Software Engineer',
      departmentId: engineering.id,
      managerId: engManager.id,
      companyId: company.id,
      location: 'San Francisco, CA',
      skills: JSON.stringify(['React', 'TypeScript', 'GraphQL', 'PostgreSQL', 'Docker']),
      hireDate: new Date('2021-02-10'),
      status: 'ACTIVE',
      gender: 'Male',
    }
  })

  const emp2 = await prisma.employee.create({
    data: {
      name: 'Emily Watson',
      email: 'emily.watson@nexus.tech',
      title: 'Software Engineer',
      departmentId: engineering.id,
      managerId: engManager.id,
      companyId: company.id,
      location: 'Remote',
      skills: JSON.stringify(['Python', 'Django', 'REST APIs', 'Redis', 'Linux']),
      hireDate: new Date('2022-06-01'),
      status: 'ACTIVE',
      gender: 'Female',
    }
  })

  const emp3 = await prisma.employee.create({
    data: {
      name: 'Jordan Kim',
      email: 'jordan.kim@nexus.tech',
      title: 'Junior Software Engineer',
      departmentId: engineering.id,
      managerId: engManager.id,
      companyId: company.id,
      location: 'Seattle, WA',
      skills: JSON.stringify(['JavaScript', 'Vue.js', 'CSS', 'HTML', 'Git']),
      // Recent hire - less than 1 year, flight risk candidate
      hireDate: new Date('2025-08-15'),
      status: 'ACTIVE',
      gender: 'Non-binary',
    }
  })

  const emp4 = await prisma.employee.create({
    data: {
      name: 'David Okafor',
      email: 'david.okafor@nexus.tech',
      title: 'DevOps Engineer',
      departmentId: engineering.id,
      managerId: engManager.id,
      companyId: company.id,
      location: 'Chicago, IL',
      skills: JSON.stringify(['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Monitoring']),
      hireDate: new Date('2021-09-20'),
      status: 'ACTIVE',
      gender: 'Male',
    }
  })

  // Sales team members
  const emp5 = await prisma.employee.create({
    data: {
      name: 'Rachel Torres',
      email: 'rachel.torres@nexus.tech',
      title: 'Account Executive',
      departmentId: sales.id,
      managerId: salesManager.id,
      companyId: company.id,
      location: 'New York, NY',
      skills: JSON.stringify(['B2B Sales', 'HubSpot', 'Cold Outreach', 'Contract Negotiation', 'Presentation']),
      hireDate: new Date('2022-01-15'),
      status: 'ACTIVE',
      gender: 'Female',
    }
  })

  const emp6 = await prisma.employee.create({
    data: {
      name: 'Tom Bradley',
      email: 'tom.bradley@nexus.tech',
      title: 'Sales Development Representative',
      departmentId: sales.id,
      managerId: salesManager.id,
      companyId: company.id,
      location: 'Boston, MA',
      skills: JSON.stringify(['Prospecting', 'Outreach', 'CRM', 'LinkedIn Sales Navigator', 'Cold Calling']),
      // Recent hire - flight risk
      hireDate: new Date('2025-10-01'),
      status: 'ACTIVE',
      gender: 'Male',
    }
  })

  // Operations team members
  const emp7 = await prisma.employee.create({
    data: {
      name: 'Lisa Park',
      email: 'lisa.park@nexus.tech',
      title: 'HR Specialist',
      departmentId: operations.id,
      managerId: opsManager.id,
      companyId: company.id,
      location: 'Austin, TX',
      skills: JSON.stringify(['Recruiting', 'Onboarding', 'HRIS', 'Employee Relations', 'Benefits Administration']),
      hireDate: new Date('2020-08-01'),
      status: 'ACTIVE',
      gender: 'Female',
    }
  })

  const emp8 = await prisma.employee.create({
    data: {
      name: 'Carlos Mendez',
      email: 'carlos.mendez@nexus.tech',
      title: 'Finance Analyst',
      departmentId: operations.id,
      managerId: opsManager.id,
      companyId: company.id,
      location: 'Miami, FL',
      skills: JSON.stringify(['Financial Modeling', 'Excel', 'QuickBooks', 'Budget Planning', 'FP&A']),
      hireDate: new Date('2023-03-20'),
      status: 'ACTIVE',
      gender: 'Male',
    }
  })

  const emp9 = await prisma.employee.create({
    data: {
      name: 'Aisha Mohammed',
      email: 'aisha.mohammed@nexus.tech',
      title: 'Office Administrator',
      departmentId: operations.id,
      managerId: opsManager.id,
      companyId: company.id,
      location: 'Austin, TX',
      skills: JSON.stringify(['Office Management', 'Scheduling', 'Travel Coordination', 'Vendor Management', 'MS Office']),
      hireDate: new Date('2019-05-10'),
      status: 'ACTIVE',
      gender: 'Female',
    }
  })
  console.log('Created 12 employees')

  // Create 4 demo users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@hireflow.dev',
      name: 'HireFlow Admin',
      role: 'SUPER_ADMIN',
    }
  })

  const hrAdmin = await prisma.user.create({
    data: {
      email: 'hr@nexus.tech',
      name: 'Lisa Park',
      role: 'HR_ADMIN',
      companyId: company.id,
      employeeId: emp7.id,
    }
  })

  const manager = await prisma.user.create({
    data: {
      email: 'manager@nexus.tech',
      name: 'Sarah Chen',
      role: 'MANAGER',
      companyId: company.id,
      employeeId: engManager.id,
    }
  })

  const empUser = await prisma.user.create({
    data: {
      email: 'emp@nexus.tech',
      name: 'Alex Rivera',
      role: 'EMPLOYEE',
      companyId: company.id,
      employeeId: emp1.id,
    }
  })
  console.log('Created 4 demo users: admin@hireflow.dev, hr@nexus.tech, manager@nexus.tech, emp@nexus.tech')

  // Create 2 jobs
  const job1 = await prisma.job.create({
    data: {
      title: 'Senior Software Engineer',
      description: 'We are looking for a Senior Software Engineer to join our growing engineering team. You will work on our core product platform, mentor junior engineers, and help shape our technical direction. The ideal candidate has strong experience with full-stack development and a passion for building scalable systems.',
      requirements: JSON.stringify([
        '5+ years of software engineering experience',
        'Proficiency in TypeScript and React',
        'Experience with Node.js and REST/GraphQL APIs',
        'Familiarity with cloud platforms (AWS, GCP, or Azure)',
        'Strong understanding of database design (SQL and NoSQL)',
        'Experience with CI/CD pipelines and DevOps practices',
        'Excellent communication and collaboration skills',
      ]),
      companyId: company.id,
      status: 'OPEN',
    }
  })

  const job2 = await prisma.job.create({
    data: {
      title: 'Product Manager',
      description: 'Nexus Technologies is seeking an experienced Product Manager to lead the development of our enterprise SaaS platform. You will work cross-functionally with engineering, design, and sales to define product strategy, manage the roadmap, and ensure successful delivery of key features. You will be the voice of the customer and a champion for great user experiences.',
      requirements: JSON.stringify([
        '3+ years of product management experience, preferably in B2B SaaS',
        'Strong analytical skills and data-driven decision making',
        'Experience with agile methodologies and sprint planning',
        'Excellent written and verbal communication skills',
        'Ability to translate customer needs into product requirements',
        'Experience with product analytics tools (Mixpanel, Amplitude, etc.)',
        'MBA or equivalent experience preferred',
      ]),
      companyId: company.id,
      status: 'OPEN',
    }
  })
  console.log('Created 2 jobs: Senior Software Engineer, Product Manager')

  // Create 5 candidates
  await prisma.candidate.create({
    data: {
      jobId: job1.id,
      name: 'Michael Zhang',
      email: 'michael.zhang@email.com',
      resumeText: `Michael Zhang - Senior Software Engineer
Email: michael.zhang@email.com | LinkedIn: linkedin.com/in/michaelzhang

SUMMARY
Experienced full-stack engineer with 7 years building scalable web applications. Strong expertise in React, TypeScript, and Node.js with a proven track record delivering high-quality software at fast-growing startups and mid-size companies.

EXPERIENCE
Staff Software Engineer | TechStartup Inc | 2021 - Present
- Led development of microservices architecture serving 500K+ daily active users
- Mentored team of 5 junior engineers through code reviews and pair programming
- Reduced API response times by 40% through query optimization and caching strategies
- Built React component library adopted across 3 product teams

Senior Software Engineer | DataCo | 2019 - 2021
- Developed customer-facing dashboard using React and TypeScript
- Integrated with third-party APIs and payment processors
- Implemented automated testing increasing code coverage from 45% to 85%

SKILLS
TypeScript, React, Node.js, GraphQL, PostgreSQL, Redis, AWS, Docker, Kubernetes, CI/CD

EDUCATION
BS Computer Science, UC Berkeley, 2017`,
      aiScore: 92.5,
      aiExplanation: 'Exceptional candidate with 7 years of directly relevant experience. Strong match on TypeScript, React, Node.js requirements. Demonstrated leadership through mentoring and architecture decisions. Quantified impact with metrics.',
      stage: 'INTERVIEW',
      companyId: company.id,
    }
  })

  await prisma.candidate.create({
    data: {
      jobId: job1.id,
      name: 'Samantha Lee',
      email: 'sam.lee@email.com',
      resumeText: `Samantha Lee
sam.lee@email.com

Work Experience:
Software Engineer - MegaCorp (2020-2023)
Built internal tools using React and Python. Worked on authentication systems.

Junior Developer - WebAgency (2018-2020)
Created websites for clients using HTML, CSS, JavaScript.

Skills: JavaScript, React, Python, HTML, CSS, Git

Education: BS Information Technology, State University 2018`,
      aiScore: 58.0,
      aiExplanation: 'Candidate shows some relevant experience with React but lacks the required 5+ years and TypeScript expertise. No evidence of backend Node.js experience or cloud platform knowledge. May be suitable for mid-level role.',
      stage: 'SCREENED',
      companyId: company.id,
    }
  })

  await prisma.candidate.create({
    data: {
      jobId: job1.id,
      name: 'James Okonkwo',
      email: 'james.okonkwo@email.com',
      resumeText: `JAMES OKONKWO | Senior Engineer
james.okonkwo@email.com | github.com/jokonkwo

PROFESSIONAL EXPERIENCE

Senior Software Engineer | FinTech Solutions | Jan 2020 - Present
• Architected event-driven microservices handling 1M+ transactions/day using Node.js and Kafka
• Led migration from monolith to microservices, reducing deployment time by 60%
• Built real-time dashboard with React, WebSockets, and TypeScript for trading operations
• Managed PostgreSQL database cluster with 99.99% uptime SLA

Software Engineer | CloudFirst | Mar 2017 - Dec 2019
• Developed REST and GraphQL APIs serving mobile and web clients
• Implemented automated testing pipeline using Jest and Cypress
• Collaborated with product team to deliver 12 major features on schedule

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, Go
Frontend: React, Next.js, Redux, CSS-in-JS
Backend: Node.js, Express, GraphQL, REST
Database: PostgreSQL, MongoDB, Redis
Cloud: AWS (EC2, RDS, S3, Lambda), Docker, Kubernetes
Tools: Git, GitHub Actions, Terraform, DataDog

EDUCATION
MSc Computer Science, Georgia Tech, 2017
BSc Computer Engineering, University of Lagos, 2015`,
      aiScore: 95.0,
      aiExplanation: 'Outstanding candidate. 7+ years of highly relevant experience with perfect skill match. Demonstrated expertise in TypeScript, React, Node.js, GraphQL, PostgreSQL, and AWS. Strong quantified achievements and architecture-level experience. Top recommendation for hire.',
      stage: 'OFFER',
      companyId: company.id,
    }
  })

  await prisma.candidate.create({
    data: {
      jobId: job2.id,
      name: 'Nicole Parker',
      email: 'nicole.parker@email.com',
      resumeText: `Nicole Parker | Product Manager
nicole.parker@email.com

SUMMARY
Strategic product manager with 5 years experience building B2B SaaS products from 0 to 1 and scaling them to enterprise customers. Data-driven approach with strong focus on customer outcomes.

EXPERIENCE
Senior Product Manager | SaasGrowth Co | 2021-Present
- Owned product roadmap for core platform serving 200+ enterprise customers
- Launched 3 major features driving 30% increase in NPS
- Led discovery process including 50+ customer interviews per quarter
- Partnered with sales to create product-led growth motion increasing ARR by $2M

Product Manager | CloudSuite | 2019-2021
- Managed 2 product areas with 4 engineers and 1 designer
- Ran A/B tests using Mixpanel improving trial-to-paid conversion by 15%
- Created detailed PRDs and user stories for agile development

SKILLS
Product Strategy, Roadmapping, User Research, Data Analysis, Agile/Scrum
Tools: JIRA, Confluence, Figma, Mixpanel, Amplitude, SQL

EDUCATION
MBA, Wharton School, University of Pennsylvania, 2019
BA Economics, Duke University, 2017`,
      aiScore: 88.0,
      aiExplanation: 'Strong PM candidate with directly relevant B2B SaaS experience. Meets MBA requirement and demonstrates data-driven approach with quantified results. Good fit for the role.',
      stage: 'SCREENED',
      companyId: company.id,
    }
  })

  await prisma.candidate.create({
    data: {
      jobId: job2.id,
      name: 'Derek Huang',
      email: 'derek.huang@email.com',
      resumeText: `Derek Huang
derek.huang@gmail.com

I am a motivated professional looking to transition into product management. I have been a software developer for 3 years and want to leverage my technical background.

Current Role: Software Developer at Startup (2022-Present)
Previous: Intern at Tech Company (2021-2022)

I have good communication skills and have always been interested in the product side of things. I understand how developers think which could be useful for a PM role.

Technical Skills: Java, Python, SQL
Education: BS Computer Science, 2021`,
      aiScore: 32.0,
      aiExplanation: 'Candidate lacks PM experience and does not meet the 3-year requirement. Career transition candidate without product management background. Missing key competencies: product strategy, roadmapping, customer research, analytics tools. Not recommended at this time.',
      stage: 'REJECTED',
      companyId: company.id,
    }
  })
  console.log('Created 5 candidates across 2 jobs')

  // Create 3 policy documents
  await prisma.policyDocument.create({
    data: {
      filename: 'leave-policy-2024.pdf',
      content: `ACME CORP LEAVE POLICY
Effective Date: January 1, 2024
Version: 3.2

1. OVERVIEW
Nexus Technologies provides a comprehensive leave program to support employee well-being and work-life balance. This policy applies to all full-time employees. Part-time and contract employees should refer to their specific agreements.

2. TYPES OF LEAVE

2.1 Annual Leave (Vacation)
Full-time employees are entitled to:
- 0-2 years of service: 15 days per year
- 2-5 years of service: 20 days per year
- 5+ years of service: 25 days per year

Annual leave accrues at the rate of 1.25 days per month (for 15-day entitlement). Maximum carryover is 5 days per year. Unused leave beyond the carryover limit is forfeited at year end. Employees should request annual leave at least 2 weeks in advance, except in emergencies.

2.2 Sick Leave
Employees receive 10 sick days per year. Sick leave does not roll over to the next year. For absences longer than 3 consecutive days, a doctor's note is required. Sick leave may be used for the employee's own illness or to care for an immediate family member.

2.3 Casual Leave
Employees receive 5 casual leave days per year for personal matters. Casual leave must be approved by the direct manager. Same-day requests are at the manager's discretion.

3. LEAVE REQUEST PROCESS
1. Submit leave request through the HireFlow portal
2. Manager receives notification and must approve/reject within 2 business days
3. HR is notified of all approved leave
4. Employee receives confirmation email

4. HOLIDAY SCHEDULE
Nexus Technologies observes 11 public holidays per year. The holiday calendar is published at the beginning of each year.

5. MATERNITY & PATERNITY LEAVE
- Primary caregiver: 16 weeks fully paid
- Secondary caregiver: 4 weeks fully paid
Employees must notify HR at least 30 days before the expected leave start date.

6. BEREAVEMENT LEAVE
- Immediate family (spouse, child, parent): 5 days paid
- Extended family (sibling, grandparent, in-law): 3 days paid

7. LEAVE WITHOUT PAY
In exceptional circumstances, employees may request unpaid leave. Requests must be approved by HR and the department head. Maximum 3 months per year.

8. CONTACT
For questions about this policy, contact hr@nexus.tech.`,
      companyId: company.id,
    }
  })

  await prisma.policyDocument.create({
    data: {
      filename: 'code-of-conduct-2024.pdf',
      content: `ACME CORP CODE OF CONDUCT
Effective Date: January 1, 2024

1. INTRODUCTION
Nexus Technologies is committed to maintaining a workplace that is respectful, inclusive, and free from harassment and discrimination. All employees, contractors, and business partners are expected to uphold the values outlined in this Code of Conduct.

2. CORE VALUES
- Integrity: We act with honesty and transparency in all interactions
- Respect: We treat every person with dignity regardless of their background
- Excellence: We strive for quality in everything we do
- Collaboration: We work together to achieve shared goals
- Innovation: We embrace new ideas and continuous improvement

3. WORKPLACE BEHAVIOR

3.1 Respectful Workplace
Employees are expected to:
- Treat colleagues, clients, and partners with respect
- Listen actively and consider diverse perspectives
- Provide constructive feedback professionally
- Maintain a positive and collaborative work environment

3.2 Harassment and Discrimination
Nexus Technologies has zero tolerance for:
- Sexual harassment or unwanted advances
- Discrimination based on race, color, religion, gender, age, disability, sexual orientation, or national origin
- Bullying or intimidation of any kind
- Retaliation against those who report misconduct

3.3 Conflict of Interest
Employees must disclose any personal, financial, or other interests that may conflict with their responsibilities at Nexus Technologies. This includes outside employment, investments in competitors, or relationships with vendors.

4. DATA AND CONFIDENTIALITY

4.1 Confidential Information
Employees must protect confidential company information including:
- Customer data and personal information
- Financial data and projections
- Product roadmaps and technical specifications
- Employee records and compensation data

4.2 Data Security
All employees must:
- Use strong, unique passwords and enable multi-factor authentication
- Not share login credentials with others
- Lock computers when leaving workstations
- Report suspected data breaches to IT immediately

5. USE OF COMPANY RESOURCES
Company equipment, systems, and resources should be used primarily for business purposes. Limited personal use is acceptable if it does not interfere with work performance or violate other policies.

6. SOCIAL MEDIA
Employees should not share confidential company information on social media. Personal opinions expressed online should not be presented as representing Nexus Technologies's views.

7. REPORTING VIOLATIONS
Suspected violations should be reported to:
- Direct manager (if not involved in the issue)
- HR Department: hr@nexus.tech
- Anonymous Ethics Hotline: [ethics hotline number]

All reports will be investigated promptly and confidentially. Retaliation against anyone who makes a good-faith report is strictly prohibited.

8. CONSEQUENCES
Violations may result in disciplinary action up to and including termination of employment.`,
      companyId: company.id,
    }
  })

  await prisma.policyDocument.create({
    data: {
      filename: 'wfh-policy-2024.pdf',
      content: `ACME CORP WORK FROM HOME (WFH) POLICY
Effective Date: March 1, 2024
Version: 2.0

1. PURPOSE
This policy establishes guidelines for remote work arrangements at Nexus Technologies. We believe flexibility supports productivity and employee well-being while maintaining collaboration and team effectiveness.

2. ELIGIBILITY
Remote work is available to employees who:
- Have been employed at Nexus Technologies for at least 3 months
- Have satisfactory or better performance rating
- Have a role that can be performed effectively remotely
- Have appropriate home workspace and technology

3. REMOTE WORK ARRANGEMENTS

3.1 Hybrid Model (Default)
Most employees are on a hybrid schedule:
- Minimum 2 days per week in office (Tuesday and Thursday preferred)
- Up to 3 days remote
- Department heads may require additional in-office days for team needs

3.2 Fully Remote
Fully remote arrangements are available for roles designated as remote-eligible. These must be approved by the department VP and HR. Employees in fully remote roles are expected to travel to HQ offices at least once per quarter.

4. EXPECTATIONS FOR REMOTE EMPLOYEES

4.1 Availability
- Core hours: 10 AM - 4 PM in your primary time zone
- Respond to messages within 2 hours during core hours
- Attend all scheduled meetings unless conflict is communicated in advance
- Update calendar to reflect working hours and availability

4.2 Communication
- Use Slack for real-time communication
- Use email for formal communications requiring a record
- Video on during team meetings is strongly encouraged
- Proactively communicate blockers and progress updates

4.3 Workspace
Employees are responsible for maintaining:
- Reliable internet connection (minimum 25 Mbps recommended)
- Quiet, professional environment for video calls
- Ergonomic workspace (company provides $500 home office stipend)

5. EQUIPMENT AND SECURITY
- Company-issued laptop must be used for all work
- VPN must be enabled when accessing company systems from non-office locations
- Do not work from public WiFi without VPN
- Screen lock must activate after 5 minutes of inactivity

6. HOME OFFICE STIPEND
Employees receive a one-time $500 stipend for home office setup upon approval of remote work arrangement. Recurring $50/month internet stipend is available for employees working remote 3+ days per week.

7. TIME TRACKING AND PRODUCTIVITY
Nexus Technologies does not use surveillance software. We trust employees to manage their time effectively. Managers evaluate performance based on output and results, not hours online.

8. AMENDMENTS
This policy may be updated based on business needs. Significant changes will be communicated with 30 days advance notice.

9. CONTACT
Questions about this policy: hr@nexus.tech`,
      companyId: company.id,
    }
  })
  console.log('Created 3 policy documents')

  // Create leave requests
  await prisma.leaveRequest.create({
    data: {
      employeeId: emp1.id,
      type: 'ANNUAL',
      startDate: new Date('2026-05-05'),
      endDate: new Date('2026-05-09'),
      reason: 'Family vacation to Hawaii for spring break',
      status: 'PENDING',
      managerId: engManager.id,
      companyId: company.id,
    }
  })

  await prisma.leaveRequest.create({
    data: {
      employeeId: emp2.id,
      type: 'SICK',
      startDate: new Date('2026-04-20'),
      endDate: new Date('2026-04-21'),
      reason: 'Flu symptoms',
      status: 'APPROVED',
      managerId: engManager.id,
      companyId: company.id,
    }
  })

  await prisma.leaveRequest.create({
    data: {
      employeeId: emp5.id,
      type: 'CASUAL',
      startDate: new Date('2026-04-28'),
      endDate: new Date('2026-04-28'),
      reason: 'Personal appointment',
      status: 'APPROVED',
      managerId: salesManager.id,
      companyId: company.id,
    }
  })

  await prisma.leaveRequest.create({
    data: {
      employeeId: emp8.id,
      type: 'ANNUAL',
      startDate: new Date('2026-06-10'),
      endDate: new Date('2026-06-20'),
      reason: 'Summer holiday',
      status: 'REJECTED',
      managerId: opsManager.id,
      companyId: company.id,
    }
  })
  console.log('Created 4 leave requests')

  // Create leave balances for all employees
  const allEmployees = [engManager, salesManager, opsManager, emp1, emp2, emp3, emp4, emp5, emp6, emp7, emp8, emp9]

  for (const employee of allEmployees) {
    // Annual leave
    await prisma.leaveBalance.create({
      data: {
        employeeId: employee.id,
        type: 'ANNUAL',
        total: 20,
        used: Math.floor(Math.random() * 10),
        companyId: company.id,
      }
    })
    // Sick leave
    await prisma.leaveBalance.create({
      data: {
        employeeId: employee.id,
        type: 'SICK',
        total: 10,
        used: Math.floor(Math.random() * 4),
        companyId: company.id,
      }
    })
    // Casual leave
    await prisma.leaveBalance.create({
      data: {
        employeeId: employee.id,
        type: 'CASUAL',
        total: 5,
        used: Math.floor(Math.random() * 3),
        companyId: company.id,
      }
    })
  }
  console.log('Created leave balances for all 12 employees')

  // Create 2 tickets (1 escalated)
  await prisma.ticket.create({
    data: {
      employeeId: emp1.id,
      question: 'How many annual leave days do I have remaining for this year? I want to plan a vacation in May.',
      aiAnswer: 'Based on your leave balance, you currently have 12 annual leave days remaining for 2026. You have used 8 days so far this year. For a 5-day vacation in May, you would use 5 of those days, leaving you with 7 days for the rest of the year. Note: The maximum carryover is 5 days, so plan accordingly if you have remaining days at year-end.',
      escalated: false,
      resolved: true,
      companyId: company.id,
    }
  })

  await prisma.ticket.create({
    data: {
      employeeId: emp6.id,
      question: 'I believe I was passed over for a promotion unfairly due to my age. I am 52 years old and have been with the company for 3 years with excellent performance reviews. A younger colleague with less experience was promoted instead. I would like to understand my rights and what steps I can take.',
      aiAnswer: 'This is a serious concern that may involve potential age discrimination, which is prohibited under the Age Discrimination in Employment Act (ADEA) for employees 40 and older. While I can provide general information, this situation requires human HR attention. I have escalated this ticket to your HR team who will reach out within 1 business day. In the meantime, please document all relevant details including dates, the performance reviews, and any communications related to the promotion decision.',
      escalated: true,
      resolved: false,
      companyId: company.id,
    }
  })
  console.log('Created 2 tickets (1 escalated)')

  // Create some audit logs
  await prisma.auditLog.create({
    data: {
      userId: hrAdmin.id,
      action: 'CREATE',
      entity: 'Employee',
      entityId: emp3.id,
      companyId: company.id,
      diff: JSON.stringify({ name: 'Jordan Kim', title: 'Junior Software Engineer', status: 'ACTIVE' }),
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: hrAdmin.id,
      action: 'UPDATE',
      entity: 'LeaveRequest',
      entityId: 'leave-req-1',
      companyId: company.id,
      diff: JSON.stringify({ status: { from: 'PENDING', to: 'APPROVED' } }),
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: manager.id,
      action: 'UPDATE',
      entity: 'Candidate',
      entityId: 'candidate-1',
      companyId: company.id,
      diff: JSON.stringify({ stage: { from: 'SCREENED', to: 'INTERVIEW' } }),
    }
  })
  console.log('Created audit logs')

  console.log('\nSeed complete!')
  console.log('='.repeat(50))
  console.log('Company: Nexus Technologies (domain: nexus.tech)')
  console.log('\nDemo Login Emails (no password needed):')
  console.log('  admin@hireflow.dev - SUPER_ADMIN (no company)')
  console.log('  hr@nexus.tech        - HR_ADMIN (Lisa Park)')
  console.log('  manager@nexus.tech   - MANAGER (Sarah Chen)')
  console.log('  emp@nexus.tech       - EMPLOYEE (Alex Rivera)')
  console.log('\nEmployees:')
  console.log('  Engineering: Sarah Chen (mgr), Alex Rivera, Emily Watson, Jordan Kim, David Okafor')
  console.log('  Sales: Marcus Johnson (mgr), Rachel Torres, Tom Bradley')
  console.log('  Operations: Priya Sharma (mgr), Lisa Park, Carlos Mendez, Aisha Mohammed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
