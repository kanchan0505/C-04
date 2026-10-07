# MISSION
You are a senior full-stack software engineer building the prototype for the "NBA Criteria 4 Automation System".
The project automates the manual Excel calculation workflow used by faculty to prepare the official NBA (National Board of Accreditation) Criteria 4 report (Tier-II Engineering).

The system replaces manual Excel aggregation by reading raw multi-semester student result files, validating and merging student histories, deterministically computing NBA Criteria 4 metrics, managing placement cell outcomes, and generating the exact NBA report tables.

---

## 1. TECHNOLOGY STACK & ARCHITECTURE RULES

### Tech Stack
- Framework: Next.js (JavaScript / React, using the standard Pages router to adhere strictly to the layered architecture below, or App router if mirroring this pattern)
- UI & Styling: Tailwind CSS, Lucide React (icons)
- State Management: Redux Toolkit (or clean React Context/Hooks for server-state orchestration between Views and APIs)
- Database: PostgreSQL neon db 
- File Processing: `xlsx` (SheetJS) or `exceljs` for reading/parsing spreadsheet data
- Formulas & Math: Pure deterministic JavaScript functions in the Service layer (NO non-deterministic LLM math for official calculations)

### Strict Layered Architecture
You must strictly structure the codebase using the following separation of concerns:
1. `pages/` (or route entry points): Thin routing shells only. They extract route params, query strings, and render the corresponding View.
2. `src/views/`: Full-page screen orchestration, user interaction handlers, and linking UI state to API calls / store dispatchers.
3. `src/components/`: Reusable, modular atomic UI elements (e.g., Table, MetricCard, Modal, FileUploadDropzone, Navbar, Badge).
4. `pages/api/` (or API route handlers): HTTP layer. Handles request validation, HTTP status codes, error catching, and calls the appropriate Service function.
5. `src/services/`: Pure business logic, deterministic calculations, formula evaluations, Excel normalization, and Prisma database queries. Keep all NBA business rules isolated here.
6. `prisma/schema.prisma`: Schema definition, relations, migrations, and database models.
7. `src/store/`: Redux slices or service-driven API client modules for managing application state.

---

## 2. DATABASE SCHEMA DESIGN (`prisma/schema.prisma`)

Set up a schema that avoids overwriting historical marks. Backlogs, promotions, and academic performance must remain auditable:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum AdmissionType {
  REGULAR
  LATERAL_ENTRY
}

enum StudentStatus {
  ENROLLED
  DETAINED
  MIGRATED_OUT
  GRADUATED
}

enum OutcomeType {
  PLACEMENT
  HIGHER_STUDIES
  ENTREPRENEURSHIP
}

model Batch {
  id              String        @id @default(uuid())
  batchCode       String        @unique // e.g., "2020-2024", "2021-2025"
  admissionYear   Int           // e.g., 2020
  graduationYear  Int           // e.g., 2024
  sanctionedIntake Int          // N
  regularAdmitted  Int          // N1
  lateralAdmitted  Int          // N2
  separateDivision Int          @default(0) // N3
  students        Student[]
  createdAt       DateTime      @default(now())
}

model Student {
  id              String          @id @default(uuid())
  rollNumber      String          @unique // e.g., "0832CS201001"
  name            String
  batchId         String
  batch           Batch           @relation(fields: [batchId], references: [id])
  admissionType   AdmissionType   @default(REGULAR)
  currentStatus   StudentStatus   @default(ENROLLED)
  results         SemesterResult[]
  careerOutcome   CareerOutcome?
  createdAt       DateTime        @default(now())
}

model SemesterResult {
  id              String   @id @default(uuid())
  studentId       String
  student         Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  semester        Int      // 1 to 8
  rawResultText   String   // "PASS", "Fail in BT102,CS303", "Not Appeared"
  isPassed        Boolean  @default(true)
  hasBacklog      Boolean  @default(false)
  backlogCount    Int      @default(0)
  sgpa            Float?
  percentage      Float?
  isCleared       Boolean  @default(true) // cleared in reval/supplementary

  @@unique([studentId, semester])
}

model CareerOutcome {
  id              String      @id @default(uuid())
  studentId       String      @unique
  student         Student     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  outcomeType     OutcomeType
  organization    String      // Employer name, University name, or Venture name
  appointmentRef  String?     // Appointment letter ref no. or exam ID
  outcomeDate     String?     // Date of letter or admission
  createdAt       DateTime    @default(now())
}

3. BUSINESS RULES & SERVICE LAYER IMPLEMENTATION
Implement pure, tested calculation functions inside src/services/nbaCalculationService.js:
Academic Status Parser (src/services/resultParserService.js):
Parse semester strings:
If text matches PASS, set isPassed: true, hasBacklog: false, backlogCount: 0.
If text matches /Fail in (.*)/i, extract comma-separated subject codes, set isPassed: false, hasBacklog: true, backlogCount: subjects.length.
If text matches Not Appeared, set isPassed: false, hasBacklog: true.
Batch "All Clear" classification:
A student is classified as "Without Backlog" if all completed semesters have hasBacklog == false.
A student is "With Backlog" if any semester has hasBacklog == true but they have subsequently cleared all requirements.
NBA Criteria 4 Formula Engine (src/services/nbaCalculationService.js):
Enrolment Ratio (Table 4.4):
Formula: (N1 / N) * 100
Assessment: Average across the 3 most recent eligible batches.
Success Rate Without Backlog (Table 4.5):
Success Index (SI) = (Students graduated without backlog) / (N1 + N2 + N3)
Marks = 25 * Average SI (over 3 graduating batches).
Success Rate With Backlog (Table 4.6):
Success Index (SI) = (Total students successfully graduated) / (N1 + N2 + N3)
Marks = 15 * Average SI (over 3 graduating batches).
Academic Performance Index - 2nd Year & 3rd Year (Tables 4.7 & 4.8):
Formula: API = X * (Y / Z)
X = Mean SGPA/Percentage of successful students
Y = Total successful students
Z = Total students appeared in examination
Academic Performance = 1.5 * Average API.
Placement, Higher Studies & Entrepreneurship (Table 4.9):
Formula: Placement Index = (x + y + z) / N
x = Placed students
y = Higher studies students
z = Student entrepreneurs
N = Total final year students
Marks = 40 * Average Placement Index.
Traceability Feature ("Click-to-Verify"):
Every computed figure (e.g., "153 students graduated without backlog" or "129 placed") must be queryable via an API endpoint GET /api/audit/students?metric=...&batch=... returning the exact list of student records that contributed to that count.
4. UI VIEWS & USER WORKFLOW TO BUILD
Build responsive, clean Tailwind UI views located in src/views/:
Dashboard View (src/views/DashboardView.jsx):
Shows project summary cards: Total Enrolled Students, Completed Batches, Placement Index, and Readiness Score for NBA Criteria 4.
Data Ingestion View (src/views/UploadView.jsx):
File dropzone supporting multi-semester Excel uploads.
Column Mapping preview modal (maps Excel headers like Roll Number, Result Sem-I to standard system fields).
Student Directory & Backlog View (src/views/StudentsView.jsx):
Filterable table by Batch, Semester, and Academic Status (All Clear vs. With Backlog).
Action button: "Promote Cohort" to advance eligible students with one click while flagging detained students.
Placement Management View (src/views/PlacementView.jsx):
Ingestion table for placement cell records (Employer, Letter Ref No., Date).
Validation warning indicator for placement entries that do not match an enrolled final-year student.
NBA Report Preview View (src/views/ReportView.jsx):
Replicates the official NBA Criteria 4 layout:
Table 4.1.A & 4.1.B (Intake data)
Table 4.2 & 4.3 (Without Backlog & With Backlog grids)
Table 4.4 (Enrolment Ratio)
Table 4.5 & 4.6 (Success Rates)
Table 4.7 & 4.8 (Academic Performance API)
Table 4.9 & Section 4.5.a (Placement breakdown and detailed student list)
Every metric count is interactive: clicking opens an Audit Modal showing the underlying students.
"Export Consolidated Excel" and "Print/Export PDF" action buttons.
5. SEED SCRIPT FOR MOCK DATA (prisma/seed.js)
Create a runnable seed script containing realistic sample data reflecting the NBA Criteria 4 document:
Batches:
Batch 2020-2024 (CAYm4 / Graduated: 202 regular, 11 lateral, 198 final year, 129 placed)
Batch 2021-2025 (CAYm3 / 4th Year: 205 regular, 17 lateral)
Batch 2022-2026 (CAYm2 / 3rd Year: 234 regular, 11 lateral)
Batch 2023-2027 (CAYm1 / 2nd Year: 234 regular, 12 lateral)
Seed 15–20 detailed mock student records for Batch 2020 with:
Semester results for Semesters 1 through 8 (with a mix of "PASS" and "Fail in..." records).
Placement records matching companies like TCS, Cognizant, Wipro, and Accenture with realistic appointment reference numbers.
6. IMMEDIATE EXECUTION STEPS
Scaffold the folder structure matching Pages → Views → Components → API Routes → Services.
Generate the Prisma schema and create the database seed script.
Implement resultParserService.js and nbaCalculationService.js.

Create the API routes and build the ReportView and UploadView UI with Tailwind.