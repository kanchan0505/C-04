import { upsertStudent, upsertSemesterResult } from '@/services/dbService';
import { parseResultText, normalizeExcelRow } from '@/services/resultParserService';
import * as XLSX from 'xlsx';

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Parse multipart form data manually for file upload
 */
async function parseBody(req) {
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  return Buffer.concat(buffers);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await parseBody(req);
    const contentType = req.headers['content-type'] || '';

    // Handle JSON preview/mapping request
    if (contentType.includes('application/json')) {
      const data = JSON.parse(body.toString());
      return res.status(200).json({
        message: 'Column mapping received',
        mapping: data.columnMap,
        rows: data.rows?.length || 0,
      });
    }

    // Handle file upload — extract boundary and parse multipart
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart/form-data' });
    }

    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      return res.status(400).json({ error: 'No boundary found in content-type' });
    }

    // Simple multipart parser to extract file data
    const boundary = boundaryMatch[1];
    const parts = body.toString('binary').split(`--${boundary}`);

    let fileBuffer = null;
    let batchId = null;
    let columnMap = null;

    for (const part of parts) {
      if (part.includes('name="file"')) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const fileContent = part.substring(headerEnd + 4, part.lastIndexOf('\r\n'));
          fileBuffer = Buffer.from(fileContent, 'binary');
        }
      }
      if (part.includes('name="batchId"')) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          batchId = part.substring(headerEnd + 4, part.lastIndexOf('\r\n')).trim();
        }
      }
      if (part.includes('name="columnMap"')) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          try {
            columnMap = JSON.parse(part.substring(headerEnd + 4, part.lastIndexOf('\r\n')).trim());
          } catch { /* use default mapping */ }
        }
      }
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty', headers: [] });
    }

    // If no column map, return headers for mapping
    const headers = Object.keys(rows[0]);
    if (!columnMap) {
      // Auto-detect common column names
      const autoMap = {};
      for (const h of headers) {
        const lower = h.toLowerCase();
        if (lower.includes('roll') && lower.includes('number')) autoMap.rollNumber = h;
        else if (lower === 'roll no' || lower === 'roll_number' || lower === 'rollno') autoMap.rollNumber = h;
        else if (lower === 'name' || lower === 'student name' || lower === 'student_name') autoMap.name = h;
        else if (lower.includes('sem') && !lower.includes('result')) autoMap.semester = h;
        else if (lower.includes('result') || lower.includes('status')) autoMap.result = h;
        else if (lower.includes('sgpa')) autoMap.sgpa = h;
        else if (lower.includes('percent')) autoMap.percentage = h;
      }

      return res.status(200).json({
        preview: true,
        headers,
        sampleRows: rows.slice(0, 5),
        autoMap,
        totalRows: rows.length,
      });
    }

    // Process rows with column mapping
    let processed = 0;
    let errors = [];

    for (const row of rows) {
      try {
        const normalized = normalizeExcelRow(row, columnMap);
        if (!normalized.rollNumber || !normalized.semester) {
          errors.push({ row, error: 'Missing roll number or semester' });
          continue;
        }

        const student = await upsertStudent({
          rollNumber: normalized.rollNumber,
          name: normalized.name || 'Unknown',
          batchId: batchId || undefined,
          admissionType: 'REGULAR',
        });

        await upsertSemesterResult(student.id, normalized.semester, {
          rawResultText: normalized.rawResultText,
          isPassed: normalized.isPassed,
          hasBacklog: normalized.hasBacklog,
          backlogCount: normalized.backlogCount,
          sgpa: normalized.sgpa,
          percentage: normalized.percentage,
          isCleared: normalized.isPassed,
        });

        processed++;
      } catch (err) {
        errors.push({ row, error: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      processed,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
      total: rows.length,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
