import { getAllBatches, createBatch, getBatchById } from '@/services/dbService';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { id } = req.query;
      if (id) {
        const batch = await getBatchById(id);
        if (!batch) return res.status(404).json({ error: 'Batch not found' });
        return res.status(200).json(batch);
      }
      const batches = await getAllBatches();
      return res.status(200).json(batches);
    }

    if (req.method === 'POST') {
      const batch = await createBatch(req.body);
      return res.status(201).json(batch);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Batches API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
