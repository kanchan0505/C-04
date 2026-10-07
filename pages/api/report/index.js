import { getAllBatches, getBatchMetrics } from '@/services/dbService';
import { computeFullReport } from '@/services/nbaCalculationService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const batches = await getAllBatches();

    // Compute metrics for each batch
    const batchMetrics = await Promise.all(
      batches.map(b => getBatchMetrics(b.id))
    );

    // Filter out null results
    const validMetrics = batchMetrics.filter(Boolean);

    // Compute full NBA report
    const report = computeFullReport(validMetrics);

    return res.status(200).json({
      report,
      batches: validMetrics.map(m => ({
        batchId: m.batchId,
        batchCode: m.batchCode,
        admissionYear: m.admissionYear,
        graduationYear: m.graduationYear,
        sanctionedIntake: m.sanctionedIntake,
        regularAdmitted: m.regularAdmitted,
        lateralAdmitted: m.lateralAdmitted,
        separateDivision: m.separateDivision,
        totalStudents: m.totalStudents,
        totalGraduated: m.totalGraduated,
        graduatedWithoutBacklog: m.graduatedWithoutBacklog,
        placementData: m.placementData,
      })),
    });
  } catch (error) {
    console.error('Report API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
