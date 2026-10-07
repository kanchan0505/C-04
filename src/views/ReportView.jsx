import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReport, fetchAuditStudents, clearAudit } from '@/store/reportSlice';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { FileText, Download, Printer, BarChart3, Eye } from 'lucide-react';

export default function ReportView() {
  const dispatch = useDispatch();
  const { data: reportData, loading, auditStudents, auditLoading, auditMetric } = useSelector(state => state.report);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTitle, setAuditTitle] = useState('');

  useEffect(() => {
    dispatch(fetchReport());
  }, [dispatch]);

  const handleAuditClick = useCallback((metric, batchId, title) => {
    setAuditTitle(title);
    setShowAuditModal(true);
    dispatch(fetchAuditStudents({ metric, batchId }));
  }, [dispatch]);

  const handleCloseAudit = useCallback(() => {
    setShowAuditModal(false);
    dispatch(clearAudit());
  }, [dispatch]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportExcel = useCallback(() => {
    // Simple CSV export
    if (!reportData) return;
    const lines = ['Metric,Value'];
    lines.push(`Enrolment Ratio,${reportData.report.enrolmentRatio}%`);
    lines.push(`Success Without Backlog Marks,${reportData.report.successWithoutBacklog.marks}`);
    lines.push(`Success With Backlog Marks,${reportData.report.successWithBacklog.marks}`);
    lines.push(`Academic Performance 2nd Year Marks,${reportData.report.academicPerformance2ndYear.marks}`);
    lines.push(`Academic Performance 3rd Year Marks,${reportData.report.academicPerformance3rdYear.marks}`);
    lines.push(`Placement Marks,${reportData.report.placement.marks}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nba_criteria4_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [reportData]);

  if (loading || !reportData) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">NBA Report</h1>
          <p className="text-surface-400">Loading report data...</p>
        </div>
        <div className="space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const { report, batches } = reportData;

  const ClickableValue = ({ value, metric, batchId, title }) => (
    <button
      className="metric-clickable font-semibold"
      onClick={() => handleAuditClick(metric, batchId, title || metric)}
      title="Click to view contributing students"
    >
      {value}
    </button>
  );

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">NBA Criteria 4 Report</h1>
          <p className="text-surface-400 text-sm">Official NBA Criteria 4 layout — click any metric count for audit drill-down</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-surface-300 text-sm font-medium hover:bg-white/10 transition-colors"
            id="export-excel-btn"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20"
            id="print-report-btn"
          >
            <Printer size={16} />
            Print / PDF
          </button>
        </div>
      </div>

      {/* ─── Table 4.1.A & 4.1.B — Intake Data ─────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <FileText size={18} className="text-primary-400" />
          Table 4.1.A & 4.1.B — Program Intake
        </h2>
        <div className="glass-card overflow-hidden">
          <table className="nba-table">
            <thead>
              <tr>
                <th>Academic Year</th>
                <th>Batch Code</th>
                <th>Sanctioned Intake (N)</th>
                <th>Regular Admitted (N1)</th>
                <th>Lateral Admitted (N2)</th>
                <th>Separate Division (N3)</th>
                <th>Total Students</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.batchId}>
                  <td className="font-medium">{b.admissionYear}–{b.graduationYear}</td>
                  <td className="text-primary-400">{b.batchCode}</td>
                  <td className="font-semibold">{b.sanctionedIntake}</td>
                  <td>{b.regularAdmitted}</td>
                  <td>{b.lateralAdmitted}</td>
                  <td>{b.separateDivision}</td>
                  <td>
                    <ClickableValue value={b.totalStudents} metric="enrolled" batchId={b.batchId} title={`Enrolled — ${b.batchCode}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Table 4.2 & 4.3 — Graduation Grid ─────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <BarChart3 size={18} className="text-accent-400" />
          Table 4.2 & 4.3 — Graduation Summary
        </h2>
        <div className="glass-card overflow-hidden">
          <table className="nba-table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Total Students</th>
                <th>Graduated Without Backlog</th>
                <th>Total Graduated</th>
                <th>Graduated With Backlog</th>
                <th>Not Graduated</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => {
                const withBacklog = b.totalGraduated - b.graduatedWithoutBacklog;
                const notGrad = b.totalStudents - b.totalGraduated;
                return (
                  <tr key={b.batchId}>
                    <td className="font-medium text-primary-400">{b.batchCode}</td>
                    <td>{b.totalStudents}</td>
                    <td>
                      <ClickableValue value={b.graduatedWithoutBacklog} metric="graduated_without_backlog" batchId={b.batchId} title={`Without Backlog — ${b.batchCode}`} />
                    </td>
                    <td>
                      <ClickableValue value={b.totalGraduated} metric="total_graduated" batchId={b.batchId} title={`Total Graduated — ${b.batchCode}`} />
                    </td>
                    <td>
                      <ClickableValue value={withBacklog} metric="graduated_with_backlog" batchId={b.batchId} title={`With Backlog — ${b.batchCode}`} />
                    </td>
                    <td className={notGrad > 0 ? 'text-danger-400' : 'text-surface-400'}>{notGrad}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Table 4.4 — Enrolment Ratio ────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Table 4.4 — Enrolment Ratio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <p className="text-xs text-surface-500 mb-1">Formula</p>
            <p className="text-sm text-surface-300 font-mono">(N1 / N) × 100</p>
          </div>
          <div className="glass-card p-6 animated-border">
            <p className="text-xs text-surface-500 mb-1">Average Enrolment Ratio</p>
            <p className="text-3xl font-bold gradient-text">{report.enrolmentRatio}%</p>
          </div>
        </div>
        <div className="glass-card overflow-hidden mt-4">
          <table className="nba-table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>N1 (Regular)</th>
                <th>N (Intake)</th>
                <th>Enrolment Ratio</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.batchId}>
                  <td className="text-primary-400">{b.batchCode}</td>
                  <td>{b.regularAdmitted}</td>
                  <td>{b.sanctionedIntake}</td>
                  <td className="font-semibold text-accent-400">
                    {b.sanctionedIntake > 0 ? ((b.regularAdmitted / b.sanctionedIntake) * 100).toFixed(2) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Table 4.5 — Success Rate Without Backlog ───────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Table 4.5 — Success Rate (Without Backlog)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="glass-card p-5">
            <p className="text-xs text-surface-500 mb-1">Formula</p>
            <p className="text-sm text-surface-300 font-mono">SI = Grad_NoBacklog / (N1+N2+N3)</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-surface-500 mb-1">Marks Formula</p>
            <p className="text-sm text-surface-300 font-mono">25 × Avg SI</p>
          </div>
          <div className="glass-card p-5 animated-border">
            <p className="text-xs text-surface-500 mb-1">Marks Obtained</p>
            <p className="text-3xl font-bold text-accent-300">{report.successWithoutBacklog.marks} <span className="text-sm text-surface-500">/ 25</span></p>
          </div>
        </div>
        <div className="glass-card overflow-hidden">
          <table className="nba-table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Graduated Without Backlog</th>
                <th>N1 + N2 + N3</th>
                <th>Success Index (SI)</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b, i) => {
                const denom = b.regularAdmitted + b.lateralAdmitted + b.separateDivision;
                const si = denom > 0 ? (b.graduatedWithoutBacklog / denom) : 0;
                return (
                  <tr key={b.batchId}>
                    <td className="text-primary-400">{b.batchCode}</td>
                    <td>
                      <ClickableValue value={b.graduatedWithoutBacklog} metric="graduated_without_backlog" batchId={b.batchId} title={`Without Backlog — ${b.batchCode}`} />
                    </td>
                    <td>{denom}</td>
                    <td className="font-semibold text-accent-400">{si.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Table 4.6 — Success Rate With Backlog ──────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Table 4.6 — Success Rate (With Backlog)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="glass-card p-5">
            <p className="text-xs text-surface-500 mb-1">Formula</p>
            <p className="text-sm text-surface-300 font-mono">SI = Total_Grad / (N1+N2+N3)</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-surface-500 mb-1">Marks Formula</p>
            <p className="text-sm text-surface-300 font-mono">15 × Avg SI</p>
          </div>
          <div className="glass-card p-5 animated-border">
            <p className="text-xs text-surface-500 mb-1">Marks Obtained</p>
            <p className="text-3xl font-bold text-accent-300">{report.successWithBacklog.marks} <span className="text-sm text-surface-500">/ 15</span></p>
          </div>
        </div>
        <div className="glass-card overflow-hidden">
          <table className="nba-table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Total Graduated</th>
                <th>N1 + N2 + N3</th>
                <th>Success Index (SI)</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => {
                const denom = b.regularAdmitted + b.lateralAdmitted + b.separateDivision;
                const si = denom > 0 ? (b.totalGraduated / denom) : 0;
                return (
                  <tr key={b.batchId}>
                    <td className="text-primary-400">{b.batchCode}</td>
                    <td>
                      <ClickableValue value={b.totalGraduated} metric="total_graduated" batchId={b.batchId} title={`Total Graduated — ${b.batchCode}`} />
                    </td>
                    <td>{denom}</td>
                    <td className="font-semibold text-accent-400">{si.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Tables 4.7 & 4.8 — Academic Performance ───────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Tables 4.7 & 4.8 — Academic Performance Index</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <p className="text-xs text-surface-500 mb-2">2nd Year API</p>
            <p className="text-sm text-surface-300 font-mono mb-3">API = X × (Y / Z)</p>
            <p className="text-3xl font-bold text-primary-300">{report.academicPerformance2ndYear.marks.toFixed(2)}</p>
            <p className="text-xs text-surface-500 mt-1">Performance = 1.5 × Avg API</p>
          </div>
          <div className="glass-card p-6">
            <p className="text-xs text-surface-500 mb-2">3rd Year API</p>
            <p className="text-sm text-surface-300 font-mono mb-3">API = X × (Y / Z)</p>
            <p className="text-3xl font-bold text-primary-300">{report.academicPerformance3rdYear.marks.toFixed(2)}</p>
            <p className="text-xs text-surface-500 mt-1">Performance = 1.5 × Avg API</p>
          </div>
        </div>
      </section>

      {/* ─── Table 4.9 — Placement ──────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Table 4.9 & Section 4.5.a — Placement, Higher Studies & Entrepreneurship</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="glass-card p-5">
            <p className="text-xs text-surface-500 mb-1">Formula</p>
            <p className="text-sm text-surface-300 font-mono">PI = (x + y + z) / N</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-surface-500 mb-1">Marks Formula</p>
            <p className="text-sm text-surface-300 font-mono">40 × Avg PI</p>
          </div>
          <div className="glass-card p-5 animated-border">
            <p className="text-xs text-surface-500 mb-1">Marks Obtained</p>
            <p className="text-3xl font-bold text-accent-300">{report.placement.marks.toFixed(2)} <span className="text-sm text-surface-500">/ 40</span></p>
          </div>
        </div>
        <div className="glass-card overflow-hidden">
          <table className="nba-table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Placed (x)</th>
                <th>Higher Studies (y)</th>
                <th>Entrepreneurs (z)</th>
                <th>Total Final Year (N)</th>
                <th>Placement Index</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => {
                if (!b.placementData) return null;
                const { placed, higherStudies, entrepreneurs, totalFinalYear } = b.placementData;
                const pi = totalFinalYear > 0 ? ((placed + higherStudies + entrepreneurs) / totalFinalYear) : 0;
                return (
                  <tr key={b.batchId}>
                    <td className="text-primary-400">{b.batchCode}</td>
                    <td>
                      <ClickableValue value={placed} metric="placed" batchId={b.batchId} title={`Placed — ${b.batchCode}`} />
                    </td>
                    <td>
                      <ClickableValue value={higherStudies} metric="higher_studies" batchId={b.batchId} title={`Higher Studies — ${b.batchCode}`} />
                    </td>
                    <td>
                      <ClickableValue value={entrepreneurs} metric="entrepreneurs" batchId={b.batchId} title={`Entrepreneurs — ${b.batchCode}`} />
                    </td>
                    <td>{totalFinalYear}</td>
                    <td className="font-semibold text-accent-400">{pi.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Audit Modal (Click-to-Verify) ──────────────────────── */}
      <Modal isOpen={showAuditModal} onClose={handleCloseAudit} title={`Audit: ${auditTitle}`} size="xl">
        {auditLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={16} className="text-primary-400" />
              <p className="text-sm text-surface-300">
                <span className="font-semibold text-primary-400">{auditStudents.length}</span> students contributing to this metric
              </p>
            </div>
            {auditStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="nba-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Roll Number</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Semesters</th>
                      <th>Career Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditStudents.map((s, i) => (
                      <tr key={s.id}>
                        <td className="text-surface-500">{i + 1}</td>
                        <td className="font-mono text-primary-400 text-sm">{s.rollNumber}</td>
                        <td className="font-medium text-surface-200">{s.name}</td>
                        <td>
                          <Badge variant={s.currentStatus === 'GRADUATED' ? 'success' : s.currentStatus === 'DETAINED' ? 'danger' : 'info'}>
                            {s.currentStatus}
                          </Badge>
                        </td>
                        <td className="text-xs text-surface-400">
                          {s.semesterResults?.map(r => (
                            <span key={r.semester} className={`inline-block mr-1 ${r.isPassed ? 'text-accent-400' : 'text-danger-400'}`}>
                              S{r.semester}:{r.isPassed ? '✓' : '✗'}
                            </span>
                          ))}
                        </td>
                        <td>
                          {s.careerOutcome ? (
                            <span className="text-xs text-surface-300">
                              {s.careerOutcome.outcomeType} @ {s.careerOutcome.organization}
                            </span>
                          ) : (
                            <span className="text-xs text-surface-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-surface-400 text-sm text-center py-6">No students found for this metric.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
