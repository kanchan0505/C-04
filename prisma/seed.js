const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Seed script for NBA Criteria 4 mock data.
 * Creates 4 batches with realistic student records, semester results, and placement outcomes.
 */

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Myra', 'Sara', 'Anika', 'Aadhya', 'Ira', 'Saanvi', 'Prisha', 'Kiara',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Joshi', 'Reddy', 'Nair', 'Iyer',
  'Das', 'Mehta', 'Rao', 'Chauhan', 'Mishra', 'Agarwal', 'Pandey', 'Saxena', 'Thakur', 'Chopra',
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

function randomSGPA() {
  return Math.round((6 + Math.random() * 4) * 100) / 100; // 6.00 - 10.00
}

function randomPercentage() {
  return Math.round((55 + Math.random() * 40) * 100) / 100; // 55.00 - 95.00
}

function generateSemesterResults(semesters, failChance = 0.12) {
  const results = [];
  for (let sem = 1; sem <= semesters; sem++) {
    const roll = Math.random();
    let rawResultText, isPassed, hasBacklog, backlogCount;

    if (roll < failChance && sem > 1) {
      // Fail in 1-3 subjects
      const subjectCount = Math.floor(Math.random() * 3) + 1;
      const subjects = [];
      for (let s = 0; s < subjectCount; s++) {
        subjects.push(`CS${sem}0${s + 1}`);
      }
      rawResultText = `Fail in ${subjects.join(',')}`;
      isPassed = false;
      hasBacklog = true;
      backlogCount = subjectCount;
    } else if (roll < failChance + 0.03) {
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
      sgpa: isPassed ? randomSGPA() : randomSGPA() - 1.5,
      percentage: isPassed ? randomPercentage() : randomPercentage() - 10,
      isCleared: isPassed || Math.random() > 0.3, // 70% chance of clearing backlogs
    });
  }
  return results;
}

async function main() {
  console.log('🏀 Seeding NBA Criteria 4 database...\n');

  // Clear existing data
  await prisma.careerOutcome.deleteMany();
  await prisma.semesterResult.deleteMany();
  await prisma.student.deleteMany();
  await prisma.batch.deleteMany();

  // ─── Create Batches ───────────────────────────────────────────
  const batch2020 = await prisma.batch.create({
    data: {
      batchCode: '2020-2024',
      admissionYear: 2020,
      graduationYear: 2024,
      sanctionedIntake: 240,
      regularAdmitted: 202,
      lateralAdmitted: 11,
      separateDivision: 0,
    },
  });

  const batch2021 = await prisma.batch.create({
    data: {
      batchCode: '2021-2025',
      admissionYear: 2021,
      graduationYear: 2025,
      sanctionedIntake: 240,
      regularAdmitted: 205,
      lateralAdmitted: 17,
      separateDivision: 0,
    },
  });

  const batch2022 = await prisma.batch.create({
    data: {
      batchCode: '2022-2026',
      admissionYear: 2022,
      graduationYear: 2026,
      sanctionedIntake: 240,
      regularAdmitted: 234,
      lateralAdmitted: 11,
      separateDivision: 0,
    },
  });

  const batch2023 = await prisma.batch.create({
    data: {
      batchCode: '2023-2027',
      admissionYear: 2023,
      graduationYear: 2027,
      sanctionedIntake: 240,
      regularAdmitted: 234,
      lateralAdmitted: 12,
      separateDivision: 0,
    },
  });

  console.log('✅ Batches created\n');

  // ─── Seed Detailed Students for Batch 2020-2024 ──────────────
  const detailedStudents = [];
  for (let i = 1; i <= 20; i++) {
    const name = randomName();
    const rollNumber = randomRoll(20, i);
    const admissionType = i <= 17 ? 'REGULAR' : 'LATERAL_ENTRY';
    const semResults = generateSemesterResults(8, 0.15);
    const allCleared = semResults.every(r => !r.hasBacklog || r.isCleared);
    const currentStatus = allCleared ? 'GRADUATED' : (Math.random() > 0.5 ? 'GRADUATED' : 'DETAINED');

    const student = await prisma.student.create({
      data: {
        rollNumber,
        name,
        batchId: batch2020.id,
        admissionType,
        currentStatus,
        results: {
          create: semResults,
        },
      },
    });

    detailedStudents.push(student);
  }

  console.log(`✅ 20 detailed students created for batch 2020-2024\n`);

  // ─── Add Career Outcomes for Batch 2020 ───────────────────────
  const graduatedStudents2020 = detailedStudents.filter(s => s.currentStatus === 'GRADUATED');

  for (let i = 0; i < graduatedStudents2020.length; i++) {
    const student = graduatedStudents2020[i];
    let outcomeType, organization, appointmentRef, outcomeDate;

    if (i < Math.floor(graduatedStudents2020.length * 0.7)) {
      // Placement
      const company = COMPANIES[i % COMPANIES.length];
      outcomeType = 'PLACEMENT';
      organization = company.name;
      appointmentRef = `${company.prefix}/${2024}/${String(i + 1).padStart(4, '0')}`;
      outcomeDate = `2024-0${Math.floor(Math.random() * 6) + 3}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
    } else if (i < Math.floor(graduatedStudents2020.length * 0.9)) {
      // Higher Studies
      outcomeType = 'HIGHER_STUDIES';
      organization = UNIVERSITIES[i % UNIVERSITIES.length];
      appointmentRef = `GATE-2024-CS-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      outcomeDate = '2024-07-15';
    } else {
      // Entrepreneurship
      outcomeType = 'ENTREPRENEURSHIP';
      organization = `${randomName().split(' ')[0]} Tech Solutions`;
      appointmentRef = `STARTUP-REG-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      outcomeDate = '2024-06-01';
    }

    await prisma.careerOutcome.create({
      data: { studentId: student.id, outcomeType, organization, appointmentRef, outcomeDate },
    });
  }

  console.log(`✅ Career outcomes added for batch 2020-2024\n`);

  // ─── Create Lightweight Students for Other Batches ────────────
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
  console.log('✅ 15 students created for batch 2021-2025\n');

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
  console.log('✅ 12 students created for batch 2022-2026\n');

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
  console.log('✅ 10 students created for batch 2023-2027\n');

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
