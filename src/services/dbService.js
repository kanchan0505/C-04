/**
 * Database Service
 * Encapsulates all Prisma queries for batches, students, results, and career outcomes.
 * Used by API routes — keeps database logic out of HTTP handlers.
 */
import prisma from './prismaClient';

// ─── Batch Queries ──────────────────────────────────────────────
export async function getAllBatches() {
  return prisma.batch.findMany({
    orderBy: { admissionYear: 'desc' },
    include: { _count: { select: { students: true } } },
  });
}

export async function getBatchById(id) {
  return prisma.batch.findUnique({
    where: { id },
    include: {
      students: {
        include: { results: true, careerOutcome: true },
      },
    },
  });
}

export async function createBatch(data) {
  return prisma.batch.create({ data });
}

// ─── Student Queries ────────────────────────────────────────────
export async function getStudents({ batchId, semester, status, page = 1, limit = 50 }) {
  const where = {};
  if (batchId) where.batchId = batchId;
  if (status) where.currentStatus = status;
  if (semester) {
    where.results = { some: { semester: parseInt(semester, 10) } };
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { results: { orderBy: { semester: 'asc' } }, careerOutcome: true, batch: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { rollNumber: 'asc' },
    }),
    prisma.student.count({ where }),
  ]);

  return { students, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getStudentById(id) {
  return prisma.student.findUnique({
    where: { id },
    include: { results: { orderBy: { semester: 'asc' } }, careerOutcome: true, batch: true },
  });
}

export async function upsertStudent(data) {
  return prisma.student.upsert({
    where: { rollNumber: data.rollNumber },
    update: {
      name: data.name,
      currentStatus: data.currentStatus || 'ENROLLED',
    },
    create: data,
  });
}

export async function upsertSemesterResult(studentId, semester, resultData) {
  return prisma.semesterResult.upsert({
    where: { studentId_semester: { studentId, semester } },
    update: resultData,
    create: { studentId, semester, ...resultData },
  });
}

// ─── Career Outcome Queries ────────────────────────────────────
export async function upsertCareerOutcome(studentId, outcomeData) {
  return prisma.careerOutcome.upsert({
    where: { studentId },
    update: outcomeData,
    create: { studentId, ...outcomeData },
  });
}

export async function getPlacementsByBatch(batchId) {
  return prisma.careerOutcome.findMany({
    where: { student: { batchId } },
    include: { student: { select: { rollNumber: true, name: true, currentStatus: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Aggregation Queries for NBA Metrics ────────────────────────
export async function getBatchMetrics(batchId) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      students: {
        include: {
          results: { orderBy: { semester: 'asc' } },
          careerOutcome: true,
        },
      },
    },
  });

  if (!batch) return null;

  const students = batch.students;
  const totalStudents = students.length;

  // Graduated students
  const graduated = students.filter(s => s.currentStatus === 'GRADUATED');
  const totalGraduated = graduated.length;

  // Graduated without backlog
  const graduatedWithoutBacklog = graduated.filter(s =>
    s.results.every(r => !r.hasBacklog)
  ).length;

  // Placement data
  const placed = students.filter(s => s.careerOutcome?.outcomeType === 'PLACEMENT').length;
  const higherStudies = students.filter(s => s.careerOutcome?.outcomeType === 'HIGHER_STUDIES').length;
  const entrepreneurs = students.filter(s => s.careerOutcome?.outcomeType === 'ENTREPRENEURSHIP').length;

  // Final year students count
  const finalYearStudents = students.filter(s =>
    s.currentStatus === 'GRADUATED' || s.currentStatus === 'ENROLLED'
  ).length;

  return {
    batchId: batch.id,
    batchCode: batch.batchCode,
    admissionYear: batch.admissionYear,
    graduationYear: batch.graduationYear,
    sanctionedIntake: batch.sanctionedIntake,
    regularAdmitted: batch.regularAdmitted,
    lateralAdmitted: batch.lateralAdmitted,
    separateDivision: batch.separateDivision,
    totalStudents,
    totalGraduated,
    graduatedWithoutBacklog,
    placementData: {
      placed,
      higherStudies,
      entrepreneurs,
      totalFinalYear: finalYearStudents,
    },
  };
}

// ─── Audit Queries (Click-to-Verify) ───────────────────────────
export async function getAuditStudents({ metric, batchId }) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      students: {
        include: {
          results: { orderBy: { semester: 'asc' } },
          careerOutcome: true,
        },
      },
    },
  });

  if (!batch) return [];

  switch (metric) {
    case 'graduated_without_backlog':
      return batch.students.filter(s =>
        s.currentStatus === 'GRADUATED' && s.results.every(r => !r.hasBacklog)
      );

    case 'graduated_with_backlog':
      return batch.students.filter(s =>
        s.currentStatus === 'GRADUATED' && s.results.some(r => r.hasBacklog)
      );

    case 'total_graduated':
      return batch.students.filter(s => s.currentStatus === 'GRADUATED');

    case 'placed':
      return batch.students.filter(s => s.careerOutcome?.outcomeType === 'PLACEMENT');

    case 'higher_studies':
      return batch.students.filter(s => s.careerOutcome?.outcomeType === 'HIGHER_STUDIES');

    case 'entrepreneurs':
      return batch.students.filter(s => s.careerOutcome?.outcomeType === 'ENTREPRENEURSHIP');

    case 'enrolled':
      return batch.students.filter(s => s.currentStatus === 'ENROLLED');

    case 'detained':
      return batch.students.filter(s => s.currentStatus === 'DETAINED');

    default:
      return [];
  }
}

// ─── Promote Cohort ─────────────────────────────────────────────
export async function promoteCohort(batchId) {
  const students = await prisma.student.findMany({
    where: { batchId, currentStatus: 'ENROLLED' },
    include: { results: true },
  });

  const promoted = [];
  const detained = [];

  for (const student of students) {
    const hasPendingBacklogs = student.results.some(r => r.hasBacklog && !r.isCleared);
    if (hasPendingBacklogs) {
      detained.push(student);
      await prisma.student.update({
        where: { id: student.id },
        data: { currentStatus: 'DETAINED' },
      });
    } else {
      promoted.push(student);
    }
  }

  return { promoted: promoted.length, detained: detained.length };
}

// ─── Dashboard Stats ────────────────────────────────────────────
export async function getDashboardStats() {
  const [totalStudents, totalBatches, graduatedStudents, placedStudents] = await Promise.all([
    prisma.student.count(),
    prisma.batch.count(),
    prisma.student.count({ where: { currentStatus: 'GRADUATED' } }),
    prisma.careerOutcome.count({ where: { outcomeType: 'PLACEMENT' } }),
  ]);

  return {
    totalStudents,
    totalBatches,
    graduatedStudents,
    placedStudents,
  };
}
