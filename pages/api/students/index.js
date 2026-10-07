import { getStudents } from '@/services/dbService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { batchId, semester, status, page, limit } = req.query;
    const result = await getStudents({
      batchId,
      semester,
      status,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Students API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
