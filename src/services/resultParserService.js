/**
 * Result Parser Service
 * Parses raw semester result strings into structured data.
 * Pure deterministic functions — no side effects.
 */

/**
 * Parse a raw result text string into structured semester result data.
 * @param {string} rawText - e.g., "PASS", "Fail in BT102,CS303", "Not Appeared"
 * @returns {{ isPassed: boolean, hasBacklog: boolean, backlogCount: number, failedSubjects: string[] }}
 */
function parseResultText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { isPassed: false, hasBacklog: true, backlogCount: 0, failedSubjects: [] };
  }

  const trimmed = rawText.trim();

  // Case 1: PASS
  if (/^pass$/i.test(trimmed)) {
    return { isPassed: true, hasBacklog: false, backlogCount: 0, failedSubjects: [] };
  }

  // Case 2: Fail in <subject1>,<subject2>,...
  const failMatch = trimmed.match(/^fail\s+in\s+(.+)$/i);
  if (failMatch) {
    const subjects = failMatch[1]
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    return {
      isPassed: false,
      hasBacklog: true,
      backlogCount: subjects.length,
      failedSubjects: subjects,
    };
  }

  // Case 3: Not Appeared
  if (/^not\s+appeared$/i.test(trimmed)) {
    return { isPassed: false, hasBacklog: true, backlogCount: 0, failedSubjects: [] };
  }

  // Default: Treat unknown text as failed
  return { isPassed: false, hasBacklog: true, backlogCount: 0, failedSubjects: [] };
}

/**
 * Classify a student's backlog status across all semesters.
 * @param {Array<{ hasBacklog: boolean, isCleared: boolean }>} semesterResults
 * @returns {'WITHOUT_BACKLOG' | 'WITH_BACKLOG_CLEARED' | 'WITH_BACKLOG_PENDING'}
 */
function classifyStudentBacklogStatus(semesterResults) {
  if (!semesterResults || semesterResults.length === 0) {
    return 'WITHOUT_BACKLOG';
  }

  const hasAnyBacklog = semesterResults.some(r => r.hasBacklog);

  if (!hasAnyBacklog) {
    return 'WITHOUT_BACKLOG';
  }

  const allCleared = semesterResults
    .filter(r => r.hasBacklog)
    .every(r => r.isCleared);

  return allCleared ? 'WITH_BACKLOG_CLEARED' : 'WITH_BACKLOG_PENDING';
}

/**
 * Normalize an Excel row into a structured student result record.
 * @param {object} row - Raw row from Excel with mapped column names
 * @param {object} columnMap - Mapping of Excel columns to system fields
 * @returns {object} Normalized result record
 */
function normalizeExcelRow(row, columnMap) {
  const rollNumber = String(row[columnMap.rollNumber] || '').trim();
  const name = String(row[columnMap.name] || '').trim();
  const semester = parseInt(row[columnMap.semester], 10) || null;
  const rawResultText = String(row[columnMap.result] || '').trim();
  const sgpa = parseFloat(row[columnMap.sgpa]) || null;
  const percentage = parseFloat(row[columnMap.percentage]) || null;

  const parsed = parseResultText(rawResultText);

  return {
    rollNumber,
    name,
    semester,
    rawResultText,
    sgpa,
    percentage,
    ...parsed,
  };
}

module.exports = {
  parseResultText,
  classifyStudentBacklogStatus,
  normalizeExcelRow,
};
