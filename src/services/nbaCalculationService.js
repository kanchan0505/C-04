/**
 * NBA Criteria 4 Calculation Service
 * Pure deterministic JavaScript functions for computing all NBA metrics.
 * NO non-deterministic LLM math — all calculations are formula-based.
 */

/**
 * Table 4.4 — Enrolment Ratio
 * Formula: (N1 / N) * 100
 * @param {number} N1 - Regular students admitted
 * @param {number} N  - Sanctioned intake
 * @returns {number} Enrolment ratio percentage
 */
function computeEnrolmentRatio(N1, N) {
  if (!N || N === 0) return 0;
  return (N1 / N) * 100;
}

/**
 * Average Enrolment Ratio across multiple batches
 * @param {Array<{ N1: number, N: number }>} batches
 * @returns {number} Average enrolment ratio
 */
function averageEnrolmentRatio(batches) {
  if (!batches || batches.length === 0) return 0;
  const sum = batches.reduce((acc, b) => acc + computeEnrolmentRatio(b.N1, b.N), 0);
  return sum / batches.length;
}

/**
 * Table 4.5 — Success Rate Without Backlog
 * Success Index (SI) = (Students graduated without backlog) / (N1 + N2 + N3)
 * Marks = 25 * Average SI (over 3 graduating batches)
 * @param {number} graduatedWithoutBacklog
 * @param {number} N1 - Regular admitted
 * @param {number} N2 - Lateral admitted
 * @param {number} N3 - Separate division
 * @returns {number} Success index
 */
function computeSuccessIndexWithoutBacklog(graduatedWithoutBacklog, N1, N2, N3) {
  const denominator = (N1 || 0) + (N2 || 0) + (N3 || 0);
  if (denominator === 0) return 0;
  return graduatedWithoutBacklog / denominator;
}

/**
 * Calculate marks for Table 4.5
 * @param {Array<number>} successIndices - SI values for each batch
 * @returns {number} Marks (max 25)
 */
function marksSuccessWithoutBacklog(successIndices) {
  if (!successIndices || successIndices.length === 0) return 0;
  const avgSI = successIndices.reduce((a, b) => a + b, 0) / successIndices.length;
  return Math.min(25, 25 * avgSI);
}

/**
 * Table 4.6 — Success Rate With Backlog
 * Success Index (SI) = (Total students successfully graduated) / (N1 + N2 + N3)
 * Marks = 15 * Average SI (over 3 graduating batches)
 * @param {number} totalGraduated
 * @param {number} N1
 * @param {number} N2
 * @param {number} N3
 * @returns {number} Success index
 */
function computeSuccessIndexWithBacklog(totalGraduated, N1, N2, N3) {
  const denominator = (N1 || 0) + (N2 || 0) + (N3 || 0);
  if (denominator === 0) return 0;
  return totalGraduated / denominator;
}

/**
 * Calculate marks for Table 4.6
 * @param {Array<number>} successIndices
 * @returns {number} Marks (max 15)
 */
function marksSuccessWithBacklog(successIndices) {
  if (!successIndices || successIndices.length === 0) return 0;
  const avgSI = successIndices.reduce((a, b) => a + b, 0) / successIndices.length;
  return Math.min(15, 15 * avgSI);
}

/**
 * Tables 4.7 & 4.8 — Academic Performance Index (2nd Year & 3rd Year)
 * Formula: API = X * (Y / Z)
 *   X = Mean SGPA/Percentage of successful students
 *   Y = Total successful students
 *   Z = Total students appeared in examination
 * Academic Performance = 1.5 * Average API
 * @param {number} X - Mean SGPA/Percentage of successful students
 * @param {number} Y - Total successful students
 * @param {number} Z - Total students appeared
 * @returns {number} API value
 */
function computeAcademicPerformanceIndex(X, Y, Z) {
  if (!Z || Z === 0) return 0;
  return X * (Y / Z);
}

/**
 * Academic Performance marks
 * @param {Array<number>} apiValues - API values for each batch/year
 * @returns {number} Marks
 */
function marksAcademicPerformance(apiValues) {
  if (!apiValues || apiValues.length === 0) return 0;
  const avgAPI = apiValues.reduce((a, b) => a + b, 0) / apiValues.length;
  return 1.5 * avgAPI;
}

/**
 * Table 4.9 — Placement, Higher Studies & Entrepreneurship
 * Placement Index = (x + y + z) / N
 *   x = Placed students
 *   y = Higher studies students
 *   z = Student entrepreneurs
 *   N = Total final year students
 * Marks = 40 * Average Placement Index
 * @param {number} placed
 * @param {number} higherStudies
 * @param {number} entrepreneurs
 * @param {number} totalFinalYear
 * @returns {number} Placement index
 */
function computePlacementIndex(placed, higherStudies, entrepreneurs, totalFinalYear) {
  if (!totalFinalYear || totalFinalYear === 0) return 0;
  return ((placed || 0) + (higherStudies || 0) + (entrepreneurs || 0)) / totalFinalYear;
}

/**
 * Calculate marks for Table 4.9
 * @param {Array<number>} placementIndices
 * @returns {number} Marks (max 40)
 */
function marksPlacement(placementIndices) {
  if (!placementIndices || placementIndices.length === 0) return 0;
  const avgPI = placementIndices.reduce((a, b) => a + b, 0) / placementIndices.length;
  return Math.min(40, 40 * avgPI);
}

/**
 * Compute the full NBA Criteria 4 report data for given batches.
 * @param {Array<object>} batchData - Processed batch data with student counts
 * @returns {object} Complete report metrics
 */
function computeFullReport(batchData) {
  if (!batchData || batchData.length === 0) {
    return {
      enrolmentRatio: 0,
      successWithoutBacklog: { indices: [], marks: 0 },
      successWithBacklog: { indices: [], marks: 0 },
      academicPerformance2ndYear: { apis: [], marks: 0 },
      academicPerformance3rdYear: { apis: [], marks: 0 },
      placement: { indices: [], marks: 0 },
    };
  }

  // Enrolment Ratio (Table 4.4)
  const enrolmentBatches = batchData.map(b => ({ N1: b.regularAdmitted, N: b.sanctionedIntake }));
  const enrolmentRatio = averageEnrolmentRatio(enrolmentBatches);

  // Success Without Backlog (Table 4.5)
  const siWithout = batchData
    .filter(b => b.graduatedWithoutBacklog !== undefined)
    .map(b => computeSuccessIndexWithoutBacklog(
      b.graduatedWithoutBacklog, b.regularAdmitted, b.lateralAdmitted, b.separateDivision
    ));
  const marksWithout = marksSuccessWithoutBacklog(siWithout);

  // Success With Backlog (Table 4.6)
  const siWith = batchData
    .filter(b => b.totalGraduated !== undefined)
    .map(b => computeSuccessIndexWithBacklog(
      b.totalGraduated, b.regularAdmitted, b.lateralAdmitted, b.separateDivision
    ));
  const marksWith = marksSuccessWithBacklog(siWith);

  // Academic Performance (Tables 4.7 & 4.8)
  const api2nd = batchData
    .filter(b => b.api2ndYear)
    .map(b => computeAcademicPerformanceIndex(b.api2ndYear.X, b.api2ndYear.Y, b.api2ndYear.Z));
  const marks2nd = marksAcademicPerformance(api2nd);

  const api3rd = batchData
    .filter(b => b.api3rdYear)
    .map(b => computeAcademicPerformanceIndex(b.api3rdYear.X, b.api3rdYear.Y, b.api3rdYear.Z));
  const marks3rd = marksAcademicPerformance(api3rd);

  // Placement (Table 4.9)
  const pi = batchData
    .filter(b => b.placementData)
    .map(b => computePlacementIndex(
      b.placementData.placed, b.placementData.higherStudies,
      b.placementData.entrepreneurs, b.placementData.totalFinalYear
    ));
  const marksP = marksPlacement(pi);

  return {
    enrolmentRatio: Math.round(enrolmentRatio * 100) / 100,
    successWithoutBacklog: { indices: siWithout, marks: Math.round(marksWithout * 100) / 100 },
    successWithBacklog: { indices: siWith, marks: Math.round(marksWith * 100) / 100 },
    academicPerformance2ndYear: { apis: api2nd, marks: Math.round(marks2nd * 100) / 100 },
    academicPerformance3rdYear: { apis: api3rd, marks: Math.round(marks3rd * 100) / 100 },
    placement: { indices: pi, marks: Math.round(marksP * 100) / 100 },
  };
}

module.exports = {
  computeEnrolmentRatio,
  averageEnrolmentRatio,
  computeSuccessIndexWithoutBacklog,
  marksSuccessWithoutBacklog,
  computeSuccessIndexWithBacklog,
  marksSuccessWithBacklog,
  computeAcademicPerformanceIndex,
  marksAcademicPerformance,
  computePlacementIndex,
  marksPlacement,
  computeFullReport,
};
