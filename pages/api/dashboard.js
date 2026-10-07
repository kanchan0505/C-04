import { getDashboardStats, getAllBatches } from '@/services/dbService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [stats, batches] = await Promise.all([
      getDashboardStats(),
      getAllBatches(),
    ]);

    return res.status(200).json({
      ...stats,
      batches: batches.map(b => ({
        id: b.id,
        batchCode: b.batchCode,
        admissionYear: b.admissionYear,
        graduationYear: b.graduationYear,
        sanctionedIntake: b.sanctionedIntake,
        regularAdmitted: b.regularAdmitted,
        lateralAdmitted: b.lateralAdmitted,
        studentCount: b._count.students,
      })),
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
