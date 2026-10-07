import { getAuditStudents } from '@/services/dbService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { metric, batch } = req.query;

    if (!metric || !batch) {
      return res.status(400).json({ error: 'Both "metric" and "batch" query params are required' });
    }

    const students = await getAuditStudents({ metric, batchId: batch });

    return res.status(200).json({
      metric,
      batchId: batch,
      count: students.length,
      students: students.map(s => ({
        id: s.id,
        rollNumber: s.rollNumber,
        name: s.name,
        currentStatus: s.currentStatus,
        semesterResults: s.results?.map(r => ({
          semester: r.semester,
          rawResultText: r.rawResultText,
          isPassed: r.isPassed,
          hasBacklog: r.hasBacklog,
          sgpa: r.sgpa,
        })),
        careerOutcome: s.careerOutcome ? {
          outcomeType: s.careerOutcome.outcomeType,
          organization: s.careerOutcome.organization,
          appointmentRef: s.careerOutcome.appointmentRef,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Audit API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
