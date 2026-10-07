import { getPlacementsByBatch, upsertCareerOutcome } from '@/services/dbService';
import prisma from '@/services/prismaClient';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { batchId } = req.query;
      if (!batchId) return res.status(400).json({ error: 'batchId is required' });
      const placements = await getPlacementsByBatch(batchId);
      return res.status(200).json(placements);
    }

    if (req.method === 'POST') {
      const { rollNumber, outcomeType, organization, appointmentRef, outcomeDate } = req.body;

      if (!rollNumber || !outcomeType || !organization) {
        return res.status(400).json({ error: 'rollNumber, outcomeType, and organization are required' });
      }

      // Find the student by roll number
      const student = await prisma.student.findUnique({ where: { rollNumber } });
      if (!student) {
        return res.status(404).json({
          error: `Student with roll number ${rollNumber} not found`,
          warning: true,
        });
      }

      // Check if student is in final year or graduated
      if (student.currentStatus !== 'ENROLLED' && student.currentStatus !== 'GRADUATED') {
        return res.status(400).json({
          error: `Student ${rollNumber} has status ${student.currentStatus} — not eligible for placement entry`,
          warning: true,
        });
      }

      const outcome = await upsertCareerOutcome(student.id, {
        outcomeType,
        organization,
        appointmentRef: appointmentRef || null,
        outcomeDate: outcomeDate || null,
      });

      return res.status(201).json(outcome);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Placement API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
