const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

/**
 * Seed script for NBA Criteria 4 mock data.
 * Creates 4 batches with realistic student records, semester results, and placement outcomes.
 * Batch 2020-2024: 213 intake (202 regular, 11 lateral), 198 final year, 153 without backlog, 182 graduated, 129 placed.
 */

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Myra', 'Sara', 'Anika', 'Aadhya', 'Ira', 'Saanvi', 'Prisha', 'Kiara',
  'Rohan', 'Tanvi', 'Kabir', 'Sneha', 'Dhruv', 'Neha', 'Rishi', 'Pooja', 'Varun', 'Kavya',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Joshi', 'Reddy', 'Nair', 'Iyer',
  'Das', 'Mehta', 'Rao', 'Chauhan', 'Mishra', 'Agarwal', 'Pandey', 'Saxena', 'Thakur', 'Chopra',
  'Bose', 'Chatterjee', 'Mukherjee', 'Bhatt', 'Pandit', 'Nambiar', 'Pillai', 'Deshmukh', 'Kulkarni', 'Jadhav',
];

const COMPANIES = [
  { name: 'TCS', prefix: 'TCS/APT' },
  { name: 'Cognizant', prefix: 'CTS/OL' },
  { name: 'Wipro', prefix: 'WPR/HR' },
  { name: 'Accenture', prefix: 'ACN/CA' },
  { name: 'Infosys', prefix: 'INF/OL' },
  { name: 'HCL Technologies', prefix: 'HCL/AP' },
  { name: 'Tech Mahindra', prefix: 'TML/LO' },
  { name: 'Capgemini', prefix: 'CAP/OL' },
];

const UNIVERSITIES = [
  'IIT Delhi', 'IIT Bombay', 'NIT Trichy', 'BITS Pilani', 'University of Texas',
];

function randomName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

function randomRoll(year, index) {
  const idx = String(index).padStart(3, '0');
  return `0832CS${year}${idx}`;
}

function randomSGPA(min = 6.5, max = 9.8) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomPercentage(min = 60, max = 95) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function generateSemesterResults(semesters, failChance = 0.12) {
  const results = [];
  for (let sem = 1; sem <= semesters; sem++) {
    const roll = Math.random();
    let rawResultText, isPassed, hasBacklog, backlogCount;

    if (roll < failChance && sem > 1) {
      const subjectCount = Math.floor(Math.random() * 2) + 1;
      const subjects = [];
      for (let s = 0; s < subjectCount; s++) {
        subjects.push(`CS${sem}0${s + 1}`);
      }
      rawResultText = `Fail in ${subjects.join(',')}`;
      isPassed = false;
      hasBacklog = true;
      backlogCount = subjectCount;
    } else if (roll < failChance + 0.02) {
      rawResultText = 'Not Appeared';
      isPassed = false;
      hasBacklog = true;
      backlogCount = 0;
    } else {
      rawResultText = 'PASS';
      isPassed = true;
      hasBacklog = false;
      backlogCount = 0;
    }

    results.push({
      semester: sem,
      rawResultText,
      isPassed,
      hasBacklog,
      backlogCount,
      sgpa: isPassed ? randomSGPA(6.5, 9.5) : randomSGPA(5.0, 6.5),
      percentage: isPassed ? randomPercentage(60, 92) : randomPercentage(45, 60),
      isCleared: isPassed || Math.random() > 0.3,
    });
  }
  return results;
}

async function main() {
  console.log('🏀 Seeding NBA Criteria 4 database...\n');

  // Clear existing student and outcome data
  await prisma.careerOutcome.deleteMany({});
  await prisma.semesterResult.deleteMany({});
  await prisma.student.deleteMany({});

  // ─── Create or Update Batches (Idempotent Upsert) ─────────────
  // Total intake: N1 + N2 + N3 = 202 + 11 + 0 = 213
  const batch2020 = await prisma.batch.upsert({
    where: { batchCode: '2020-2024' },
    update: {
      admissionYear: 2020,
      graduationYear: 2024,
      sanctionedIntake: 240,
      regularAdmitted: 202,
      lateralAdmitted: 11,
      separateDivision: 0,
    },
    create: {
      batchCode: '2020-2024',
      admissionYear: 2020,
      graduationYear: 2024,
      sanctionedIntake: 240,
      regularAdmitted: 202,
      lateralAdmitted: 11,
      separateDivision: 0,
    },
  });

  // Total intake: N1 + N2 + N3 = 205 + 17 + 0 = 222
  const batch2021 = await prisma.batch.upsert({
    where: { batchCode: '2021-2025' },
    update: {
      admissionYear: 2021,
      graduationYear: 2025,
      sanctionedIntake: 240,
      regularAdmitted: 205,
      lateralAdmitted: 17,
      separateDivision: 0,
    },
    create: {
      batchCode: '2021-2025',
      admissionYear: 2021,
      graduationYear: 2025,
      sanctionedIntake: 240,
      regularAdmitted: 205,
      lateralAdmitted: 17,
      separateDivision: 0,
    },
  });

  // Total intake: N1 + N2 + N3 = 234 + 11 + 0 = 245
  const batch2022 = await prisma.batch.upsert({
    where: { batchCode: '2022-2026' },
    update: {
      admissionYear: 2022,
      graduationYear: 2026,
      sanctionedIntake: 240,
      regularAdmitted: 234,
      lateralAdmitted: 11,
      separateDivision: 0,
    },
    create: {
      batchCode: '2022-2026',
      admissionYear: 2022,
      graduationYear: 2026,
      sanctionedIntake: 240,
      regularAdmitted: 234,
      lateralAdmitted: 11,
      separateDivision: 0,
    },
  });

  // Total intake: N1 + N2 + N3 = 234 + 12 + 0 = 246
  const batch2023 = await prisma.batch.upsert({
    where: { batchCode: '2023-2027' },
    update: {
      admissionYear: 2023,
      graduationYear: 2027,
      sanctionedIntake: 240,
      regularAdmitted: 234,
      lateralAdmitted: 12,
      separateDivision: 0,
    },
    create: {
      batchCode: '2023-2027',
      admissionYear: 2023,
      graduationYear: 2027,
      sanctionedIntake: 240,
      regularAdmitted: 234,
      lateralAdmitted: 12,
      separateDivision: 0,
    },
  });

  console.log('✅ Batches created with official NBA intake numbers\n');

  // ─── Seed Full Cohort for Batch 2020-2024 (213 Students) ──────
  // Intake breakdown: 202 regular, 11 lateral
  // Graduation breakdown:
  // - 153 graduated without backlog (all 8 semesters clean)
  // - 29 graduated with backlog (backlogs in sem 2-4, all cleared)
  // - 16 final year students with pending clearance (total final year = 198)
  // - 15 detained students in earlier years (total admitted = 213)
  const students2020 = [];
  const results2020 = [];
  const outcomes2020 = [];

  for (let i = 1; i <= 213; i++) {
    const studentId = crypto.randomUUID();
    const isRegular = i <= 202;
    const admissionType = isRegular ? 'REGULAR' : 'LATERAL_ENTRY';
    const rollNumber = isRegular
      ? `0832CS201${String(i).padStart(3, '0')}`
      : `0832CS213${String(i - 202).padStart(3, '0')}`;
    const name = randomName();

    let currentStatus;
    let studentResults = [];

    if (i <= 153) {
      // 1. Graduated Without Backlog (153 students)
      currentStatus = 'GRADUATED';
      for (let sem = 1; sem <= 8; sem++) {
        studentResults.push({
          id: crypto.randomUUID(),
          studentId,
          semester: sem,
          rawResultText: 'PASS',
          isPassed: true,
          hasBacklog: false,
          backlogCount: 0,
          sgpa: randomSGPA(7.0, 9.8),
          percentage: randomPercentage(65, 95),
          isCleared: true,
        });
      }
    } else if (i <= 182) {
      // 2. Graduated With Backlog (29 students: 154 to 182)
      // Total graduated = 153 + 29 = 182
      currentStatus = 'GRADUATED';
      for (let sem = 1; sem <= 8; sem++) {
        const hadBacklogInSem = sem === 2 || sem === 3;
        studentResults.push({
          id: crypto.randomUUID(),
          studentId,
          semester: sem,
          rawResultText: hadBacklogInSem ? 'Fail in CS202' : 'PASS',
          isPassed: !hadBacklogInSem,
          hasBacklog: hadBacklogInSem,
          backlogCount: hadBacklogInSem ? 1 : 0,
          sgpa: hadBacklogInSem ? randomSGPA(5.5, 6.5) : randomSGPA(6.5, 8.5),
          percentage: hadBacklogInSem ? randomPercentage(50, 62) : randomPercentage(62, 85),
          isCleared: true, // cleared by graduation!
        });
      }
    } else if (i <= 198) {
      // 3. Final Year Enrolled with Pending Backlog (16 students: 183 to 198)
      // Reached final year (semesters 1 to 8), but status ENROLLED
      currentStatus = 'ENROLLED';
      for (let sem = 1; sem <= 8; sem++) {
        const hasPending = sem === 7 || sem === 8;
        studentResults.push({
          id: crypto.randomUUID(),
          studentId,
          semester: sem,
          rawResultText: hasPending ? 'Fail in CS701' : 'PASS',
          isPassed: !hasPending,
          hasBacklog: hasPending,
          backlogCount: hasPending ? 1 : 0,
          sgpa: randomSGPA(5.5, 7.0),
          percentage: randomPercentage(52, 68),
          isCleared: !hasPending,
        });
      }
    } else {
      // 4. Detained Students (15 students: 199 to 213)
      // Detained in 2nd year (only 4 semesters)
      currentStatus = 'DETAINED';
      for (let sem = 1; sem <= 4; sem++) {
        const failed = sem >= 3;
        studentResults.push({
          id: crypto.randomUUID(),
          studentId,
          semester: sem,
          rawResultText: failed ? 'Fail in CS301,CS302' : 'PASS',
          isPassed: !failed,
          hasBacklog: failed,
          backlogCount: failed ? 2 : 0,
          sgpa: failed ? randomSGPA(4.5, 5.5) : randomSGPA(6.0, 7.0),
          percentage: failed ? randomPercentage(45, 55) : randomPercentage(58, 68),
          isCleared: false,
        });
      }
    }

    students2020.push({
      id: studentId,
      rollNumber,
      name,
      batchId: batch2020.id,
      admissionType,
      currentStatus,
    });

    results2020.push(...studentResults);

    // ─── Career Outcomes (152 total among final year students) ─────
    // 129 Placed (students 1 to 129)
    // 15 Higher Studies (students 130 to 144)
    // 8 Entrepreneurship (students 145 to 152)
    if (i <= 129) {
      const company = COMPANIES[(i - 1) % COMPANIES.length];
      outcomes2020.push({
        id: crypto.randomUUID(),
        studentId,
        outcomeType: 'PLACEMENT',
        organization: company.name,
        appointmentRef: `${company.prefix}/2024/${String(i).padStart(4, '0')}`,
        outcomeDate: `2024-0${((i % 5) + 3)}-${String((i % 25) + 1).padStart(2, '0')}`,
      });
    } else if (i <= 144) {
      const uni = UNIVERSITIES[(i - 130) % UNIVERSITIES.length];
      outcomes2020.push({
        id: crypto.randomUUID(),
        studentId,
        outcomeType: 'HIGHER_STUDIES',
        organization: uni,
        appointmentRef: `GATE-2024-CS-${String(1000 + i)}`,
        outcomeDate: '2024-07-15',
      });
    } else if (i <= 152) {
      outcomes2020.push({
        id: crypto.randomUUID(),
        studentId,
        outcomeType: 'ENTREPRENEURSHIP',
        organization: `${name.split(' ')[0]} Innovations Pvt Ltd`,
        appointmentRef: `STARTUP-REG-2024-${String(2000 + i)}`,
        outcomeDate: '2024-06-01',
      });
    }
  }

  // Insert Batch 2020-2024 records in batches
  await prisma.student.createMany({ data: students2020 });
  await prisma.semesterResult.createMany({ data: results2020 });
  await prisma.careerOutcome.createMany({ data: outcomes2020 });

  console.log(`✅ 213 students seeded for Batch 2020-2024:
    - 153 graduated without backlog
    - 182 total graduated (29 with cleared backlog)
    - 198 reached final year (16 with pending clearance)
    - 15 detained
    - 152 career outcomes (129 placed, 15 higher studies, 8 entrepreneurs)\n`);

  // ─── Create Lightweight Students for Ongoing Batches ──────────
  // Batch 2021-2025: 4th year, 15 students
  for (let i = 1; i <= 15; i++) {
    const semResults = generateSemesterResults(7, 0.10);
    await prisma.student.create({
      data: {
        rollNumber: randomRoll(21, i),
        name: randomName(),
        batchId: batch2021.id,
        admissionType: i <= 13 ? 'REGULAR' : 'LATERAL_ENTRY',
        currentStatus: 'ENROLLED',
        results: { create: semResults },
      },
    });
  }
  console.log('✅ 15 students created for batch 2021-2025 (4th Year)\n');

  // Batch 2022-2026: 3rd year, 12 students
  for (let i = 1; i <= 12; i++) {
    const semResults = generateSemesterResults(5, 0.10);
    await prisma.student.create({
      data: {
        rollNumber: randomRoll(22, i),
        name: randomName(),
        batchId: batch2022.id,
        admissionType: i <= 10 ? 'REGULAR' : 'LATERAL_ENTRY',
        currentStatus: 'ENROLLED',
        results: { create: semResults },
      },
    });
  }
  console.log('✅ 12 students created for batch 2022-2026 (3rd Year)\n');

  // Batch 2023-2027: 2nd year, 10 students
  for (let i = 1; i <= 10; i++) {
    const semResults = generateSemesterResults(3, 0.08);
    await prisma.student.create({
      data: {
        rollNumber: randomRoll(23, i),
        name: randomName(),
        batchId: batch2023.id,
        admissionType: i <= 9 ? 'REGULAR' : 'LATERAL_ENTRY',
        currentStatus: 'ENROLLED',
        results: { create: semResults },
      },
    });
  }
  console.log('✅ 10 students created for batch 2023-2027 (2nd Year)\n');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
