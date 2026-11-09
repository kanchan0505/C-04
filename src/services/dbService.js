/**
 * Database Service
 * Encapsulates all Prisma queries for batches, students, results, and career outcomes.
 * Used by API routes — keeps database logic out of HTTP handlers.
 */
import prisma from './prismaClient.js';

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
  const studentCount = students.length;
  const totalIntake = (batch.regularAdmitted || 0) + (batch.lateralAdmitted || 0) + (batch.separateDivision || 0);

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

  // Final year students count (eligible for placement)
  // For graduated cohorts, count students who reached final year and graduated/completed
  const finalYearStudents = students.filter(s =>
    s.currentStatus === 'GRADUATED' || (s.currentStatus === 'ENROLLED' && s.results.some(r => r.semester >= 7))
  ).length;

  const isGraduated = totalGraduated > 0;

  // ─── 2nd-Year API Inputs (Semesters 3 & 4) ───────────────────────
  const appeared2ndYear = students.filter(s => {
    const sem3 = s.results.find(r => r.semester === 3);
    const sem4 = s.results.find(r => r.semester === 4);
    return sem3 && sem4;
  });
  const Z_2nd = appeared2ndYear.length;

  const successful2ndYear = appeared2ndYear.filter(s => {
    const sem3 = s.results.find(r => r.semester === 3);
    const sem4 = s.results.find(r => r.semester === 4);
    return sem3.isPassed && !sem3.hasBacklog && sem4.isPassed && !sem4.hasBacklog;
  });
  const Y_2nd = successful2ndYear.length;

  let X_2nd = 0;
  if (Y_2nd > 0) {
    const totalSGPA = successful2ndYear.reduce((acc, s) => {
      const sem3 = s.results.find(r => r.semester === 3);
      const sem4 = s.results.find(r => r.semester === 4);
      const avgStudentSGPA = ((sem3.sgpa || 0) + (sem4.sgpa || 0)) / 2;
      return acc + avgStudentSGPA;
    }, 0);
    X_2nd = Math.round((totalSGPA / Y_2nd) * 100) / 100;
  }
  const api2ndYear = Z_2nd > 0 ? {
    X: X_2nd,
    Y: Y_2nd,
    Z: Z_2nd,
    api: Math.round(X_2nd * (Y_2nd / Z_2nd) * 100) / 100,
  } : null;

  // ─── 3rd-Year API Inputs (Semesters 5 & 6) ───────────────────────
  const appeared3rdYear = students.filter(s => {
    const sem5 = s.results.find(r => r.semester === 5);
    const sem6 = s.results.find(r => r.semester === 6);
    return sem5 && sem6;
  });
  const Z_3rd = appeared3rdYear.length;

  const successful3rdYear = appeared3rdYear.filter(s => {
    const sem5 = s.results.find(r => r.semester === 5);
    const sem6 = s.results.find(r => r.semester === 6);
    return sem5.isPassed && !sem5.hasBacklog && sem6.isPassed && !sem6.hasBacklog;
  });
  const Y_3rd = successful3rdYear.length;

  let X_3rd = 0;
  if (Y_3rd > 0) {
    const totalSGPA = successful3rdYear.reduce((acc, s) => {
      const sem5 = s.results.find(r => r.semester === 5);
      const sem6 = s.results.find(r => r.semester === 6);
      const avgStudentSGPA = ((sem5.sgpa || 0) + (sem6.sgpa || 0)) / 2;
      return acc + avgStudentSGPA;
    }, 0);
    X_3rd = Math.round((totalSGPA / Y_3rd) * 100) / 100;
  }
  const api3rdYear = Z_3rd > 0 ? {
    X: X_3rd,
    Y: Y_3rd,
    Z: Z_3rd,
    api: Math.round(X_3rd * (Y_3rd / Z_3rd) * 100) / 100,
  } : null;

  return {
    batchId: batch.id,
    batchCode: batch.batchCode,
    admissionYear: batch.admissionYear,
    graduationYear: batch.graduationYear,
    sanctionedIntake: batch.sanctionedIntake,
    regularAdmitted: batch.regularAdmitted,
    lateralAdmitted: batch.lateralAdmitted,
    separateDivision: batch.separateDivision,
    totalIntake,
    totalStudents: totalIntake,
    studentCount,
    isGraduated,
    totalGraduated,
    graduatedWithoutBacklog,
    api2ndYear,
    api3rdYear,
    placementData: {
      placed,
      higherStudies,
      entrepreneurs,
      totalFinalYear: isGraduated ? finalYearStudents : 0,
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
      return batch.students;

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
