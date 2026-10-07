import { promoteCohort } from '@/services/dbService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { batchId } = req.body;
    if (!batchId) return res.status(400).json({ error: 'batchId is required' });

    const result = await promoteCohort(batchId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Promote API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
