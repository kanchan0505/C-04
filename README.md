NBA Criteria 4 Automation System

An end-to-end web platform designed to automate the manual compilation, calculation, and reporting process for NBA (National Board of Accreditation) Criteria 4: Students' Performance in Tier-II engineering institutions.

📌 Project Overview

Department faculty and accreditation coordinators traditionally spend weeks consolidating semester-wise spreadsheet files, determining academic backlog statuses, calculating complex statistical indices, and drafting final Criteria 4 compliance tables by hand.

This application introduces an automated processing pipeline between raw departmental spreadsheets and the final accreditation documentation:

⚬ Multi-Semester Consolidation: Ingests separate semester-wise grade files and unifies them into an immutable student master record using the university enrollment number as a single source of truth.
⚬ Deterministic Result Interpretation: Parses university result strings (e.g., PASS, Fail in CS501,CS502, Not Appeared) and evaluates "With Backlog" vs. "Without Backlog" classifications automatically.
⚬ Mathematical Calculation Engine: Evaluates Enrolment Ratios (N_1/N), Success Rates without backlogs, Success Rates with backlogs, Academic Performance Indices (API), and Career Outcomes without manual calculation.
⚬ Placement Cell Reconciliation: Ingests final-year outcome data (Placements, Higher Studies, Entrepreneurship) and links records to graduating cohorts.
⚬ Auditability & Traceability: Allows evaluators to click on any calculated summary figure to view the exact student records and intermediate formula evaluations behind it.

🏗️ Architecture & Technology Stack

The platform is organized around a strict layered architecture pattern:

Pages (Routing & Entry Points)
  ↓
Views (Screen-Level Orchestration & State)
  ↓
Components (Reusable Atomic UI Elements)
  ↓
API Routes (HTTP Handlers & Input Validation)
  ↓
Services (Deterministic Math, Excel Parsing & DB Operations)
  ↓
Database (PostgreSQL via Prisma ORM)


⚬ Frontend: Next.js (React / JavaScript), Tailwind CSS, Lucide React
⚬ State Management: Redux Toolkit / React Hooks for server-state orchestration
⚬ Backend: Next.js API Routes (Node.js runtime)
⚬ Database & ORM: PostgreSQL, Prisma ORM
⚬ Spreadsheet Processing: xlsx (SheetJS) / exceljs
⚬ Report Generation: HTML preview matching NBA formats, PDF/Excel export modules

## 📊 Covered NBA Criteria 4 Tables & Formulas

The core calculation service generates the following standard Criteria 4 tables:

| Section & Metric | Target Output Table | Description & Formula | Max Marks |
|---|---|---|---:|
| **4.1 Enrolment Ratio** | Table 4.4 | **Enrolment Ratio** = (N₁ / N) × 100%, averaged over 3 CAY assessment years | **20 Marks** |
| **4.2.1 Success Rate (No Backlogs)** | Table 4.2 & Table 4.5 | **SI** = Graduated Without Backlog / (N₁ + N₂ + N₃); **Marks** = 25 × Average SI across LYG, LYGm1, LYGm2 | **25 Marks** |
| **4.2.2 Success Rate (With Backlogs)** | Table 4.3 & Table 4.6 | **SI** = Total Graduated / (N₁ + N₂ + N₃); **Marks** = 15 × Average SI across 3 graduating batches | **15 Marks** |
| **4.3 Academic Performance (3rd Year)** | Table 4.7 | **API** = X × (Y / Z); **Marks** = 1.5 × Average API | **15 Marks** |
| **4.4 Academic Performance (2nd Year)** | Table 4.8 | **API** = X × (Y / Z); **Marks** = 1.5 × Average API | **15 Marks** |
| **4.5 Placements & Higher Studies** | Table 4.9 & 4.5.a | **Placement Index** = (x + y + z) / N; **Marks** = 40 × Average Index | **40 Marks** |
| **4.6 Professional Activities** | Section 4.6 | Student chapters, technical events, publications, and co-curricular awards | **20 Marks** |


## 📂 Project Directory Structure

```text
nba-criteria-4-automation/
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── src/
│   ├── components/
│   │   ├── AuditModal.jsx
│   │   ├── FileUploader.jsx
│   │   ├── Navbar.jsx
│   │   └── TableCard.jsx
│   ├── services/
│   │   ├── excelParserService.js
│   │   ├── nbaCalculationService.js
│   │   ├── resultParserService.js
│   │   └── studentService.js
│   ├── store/
│   │   ├── auditSlice.js
│   │   ├── batchSlice.js
│   │   └── index.js
│   └── views/
│       ├── DashboardView.jsx
│       ├── PlacementView.jsx
│       ├── ReportView.jsx
│       ├── StudentsView.jsx
│       └── UploadView.jsx
├── pages/
│   ├── api/
│   │   ├── audit/
│   │   │   └── students.js
│   │   ├── batches/
│   │   │   ├── index.js
│   │   │   └── promote.js
│   │   ├── calculate/
│   │   │   └── criteria4.js
│   │   ├── placements/
│   │   │   └── upload.js
│   │   └── upload/
│   │       └── results.js
│   ├── _app.jsx
│   ├── dashboard.jsx
│   ├── index.jsx
│   ├── placements.jsx
│   ├── report.jsx
│   ├── students.jsx
│   └── upload.jsx
├── .env.example
├── package.json
├── tailwind.config.js
└── README.md
```



🗄️ Database Schema Summary

The database uses an append-only result log rather than overwriting student rows across academic years:

1. Batch: Defines the 4-year cycle along with sanctioned intake (N), first-year intake (N_1), and lateral intake (N_2).
2. Student: Holds permanent personal records (rollNumber, name, admissionType: REGULAR | LATERAL_ENTRY, batchId).
3. SemesterResult: Stores individual semester performances (semester: 1..8, rawResultText, isPassed, hasBacklog, backlogCount, sgpa, isCleared).
4. CareerOutcome: Stores final-year outcomes (outcomeType: PLACEMENT | HIGHER_STUDIES | ENTREPRENEURSHIP, organization, appointmentRef, outcomeDate).

🚀 Getting Started

Prerequisites

⚬ Node.js (v18.x or later)
⚬ PostgreSQL database instance
⚬ npm, yarn, or pnpm

Installation & Setup

1. Clone the repository:
   git clone https://github.com/your-username/nba-criteria-4-automation.git
   cd nba-criteria-4-automation
   
2. Install dependencies:
   npm install
   
3. Configure environment variables:
   Create a .env file in the root directory:
   DATABASE_URL="postgresql://username:password@localhost:5432/nba_criteria4_db?schema=public"
   
4. Initialize database schema and seed mock data:
   npx prisma db push
   node prisma/seed.js
   
5. Start the local development server:
   npm run dev
   
   Open http://localhost:3000 in your browser.

🧪 Testing & Verification

⚬ Run unit tests for deterministic metric calculations:
  npm test
  
⚬ Open the Report View and click on any summary count (such as Graduated without backlog) to verify that the Audit Modal returns the correct list of contributing students.