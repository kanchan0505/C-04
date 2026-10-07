import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudents, promoteCohort, clearPromoteResult } from '@/store/studentSlice';
import { fetchBatches } from '@/store/batchSlice';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { Users, Filter, UserCheck, AlertTriangle, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function StudentsView() {
  const dispatch = useDispatch();
  const { items: students, total, page, totalPages, loading, promoteResult } = useSelector(state => state.students);
  const { items: batches } = useSelector(state => state.batches);

  const [filters, setFilters] = useState({ batchId: '', semester: '', status: '' });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchBatches());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchStudents({ ...filters, page: 1 }));
  }, [dispatch, filters]);

  const handlePageChange = useCallback((newPage) => {
    dispatch(fetchStudents({ ...filters, page: newPage }));
  }, [dispatch, filters]);

  const handlePromote = useCallback(() => {
    if (filters.batchId) {
      dispatch(promoteCohort(filters.batchId));
      setShowPromoteConfirm(false);
    }
  }, [dispatch, filters.batchId]);

  const statusBadge = (status) => {
    const map = {
      ENROLLED: { variant: 'info', label: 'Enrolled' },
      GRADUATED: { variant: 'success', label: 'Graduated' },
      DETAINED: { variant: 'danger', label: 'Detained' },
      MIGRATED_OUT: { variant: 'warning', label: 'Migrated' },
    };
    const s = map[status] || { variant: 'info', label: status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const backlogBadge = (results) => {
    if (!results || results.length === 0) return <Badge variant="info">N/A</Badge>;
    const hasBacklog = results.some(r => r.hasBacklog);
    if (!hasBacklog) return <Badge variant="success">All Clear</Badge>;
    const allCleared = results.filter(r => r.hasBacklog).every(r => r.isCleared);
    if (allCleared) return <Badge variant="warning">Cleared</Badge>;
    return <Badge variant="danger">Pending</Badge>;
  };

  const filteredStudents = searchQuery
    ? students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;

  const columns = [
    {
      header: 'Roll Number',
      accessor: 'rollNumber',
      render: (row) => <span className="font-mono text-primary-400 text-sm">{row.rollNumber}</span>,
    },
    { header: 'Name', accessor: 'name', render: (row) => <span className="font-medium text-surface-200">{row.name}</span> },
    {
      header: 'Batch',
      render: (row) => <span className="text-surface-400 text-sm">{row.batch?.batchCode || '—'}</span>,
    },
    {
      header: 'Type',
      render: (row) => (
        <span className="text-xs text-surface-400">
          {row.admissionType === 'LATERAL_ENTRY' ? 'Lateral' : 'Regular'}
        </span>
      ),
    },
    {
      header: 'Semesters',
      render: (row) => (
        <div className="flex gap-1">
          {[1,2,3,4,5,6,7,8].map(sem => {
            const result = row.results?.find(r => r.semester === sem);
            if (!result) return <div key={sem} className="w-5 h-5 rounded bg-white/5 text-[9px] flex items-center justify-center text-surface-600">{sem}</div>;
            return (
              <div
                key={sem}
                className={`w-5 h-5 rounded text-[9px] flex items-center justify-center font-bold ${
                  result.isPassed ? 'bg-accent-500/20 text-accent-400' :
                  result.isCleared ? 'bg-warning-500/20 text-warning-400' :
                  'bg-danger-500/20 text-danger-400'
                }`}
                title={`Sem ${sem}: ${result.rawResultText}`}
              >
                {sem}
              </div>
            );
          })}
        </div>
      ),
    },
    {
      header: 'Backlog',
      render: (row) => backlogBadge(row.results),
    },
    {
      header: 'Status',
      render: (row) => statusBadge(row.currentStatus),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Student Directory</h1>
          <p className="text-surface-400 text-sm">
            {total} students total • Filter by batch, semester, and status
          </p>
        </div>
        {filters.batchId && (
          <button
            onClick={() => setShowPromoteConfirm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-600 to-accent-500 text-white text-sm font-semibold hover:from-accent-500 hover:to-accent-400 transition-all shadow-lg shadow-accent-500/20"
            id="promote-cohort-btn"
          >
            <UserCheck size={16} />
            Promote Cohort
          </button>
        )}
      </div>

      {/* Promote Result Banner */}
      {promoteResult && (
        <div className="glass-card p-4 border-accent-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck size={18} className="text-accent-400" />
            <p className="text-sm text-surface-200">
              <span className="text-accent-400 font-semibold">{promoteResult.promoted}</span> promoted •{' '}
              <span className="text-danger-400 font-semibold">{promoteResult.detained}</span> detained
            </p>
          </div>
          <button onClick={() => { dispatch(clearPromoteResult()); dispatch(fetchStudents(filters)); }} className="text-xs text-surface-400 hover:text-white">
            Dismiss & Refresh
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={16} className="text-surface-400" />

          <select
            value={filters.batchId}
            onChange={(e) => setFilters(f => ({ ...f, batchId: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50"
            id="filter-batch"
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.batchCode}</option>
            ))}
          </select>

          <select
            value={filters.semester}
            onChange={(e) => setFilters(f => ({ ...f, semester: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50"
            id="filter-semester"
          >
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50"
            id="filter-status"
          >
            <option value="">All Status</option>
            <option value="ENROLLED">Enrolled</option>
            <option value="GRADUATED">Graduated</option>
            <option value="DETAINED">Detained</option>
            <option value="MIGRATED_OUT">Migrated Out</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or roll number..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50 placeholder-surface-600"
              id="student-search"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredStudents}
          onRowClick={(row) => setSelectedStudent(row)}
          emptyMessage="No students match the current filters."
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-500">
            Page {page} of {totalPages} • {total} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-white/5 text-surface-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-white/5 text-surface-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title={`Student: ${selectedStudent?.name || ''}`} size="lg">
        {selectedStudent && (
          <div className="space-y-6">
            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-surface-500 mb-1">Roll Number</p>
                <p className="font-mono text-sm text-primary-400">{selectedStudent.rollNumber}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 mb-1">Batch</p>
                <p className="text-sm text-surface-200">{selectedStudent.batch?.batchCode}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 mb-1">Admission</p>
                <p className="text-sm text-surface-200">
                  {selectedStudent.admissionType === 'LATERAL_ENTRY' ? 'Lateral Entry' : 'Regular'}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-500 mb-1">Status</p>
                {statusBadge(selectedStudent.currentStatus)}
              </div>
            </div>

            {/* Semester Results */}
            <div>
              <h3 className="text-sm font-semibold text-surface-300 mb-3">Semester Results</h3>
              <div className="overflow-x-auto">
                <table className="nba-table">
                  <thead>
                    <tr>
                      <th>Semester</th>
                      <th>Result</th>
                      <th>SGPA</th>
                      <th>Backlogs</th>
                      <th>Cleared</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent.results?.map(r => (
                      <tr key={r.semester}>
                        <td className="font-semibold">Sem {r.semester}</td>
                        <td>
                          <span className={r.isPassed ? 'text-accent-400' : 'text-danger-400'}>
                            {r.rawResultText}
                          </span>
                        </td>
                        <td>{r.sgpa?.toFixed(2) || '—'}</td>
                        <td>
                          {r.hasBacklog ? (
                            <span className="text-danger-400">{r.backlogCount || 'Yes'}</span>
                          ) : (
                            <span className="text-accent-400">None</span>
                          )}
                        </td>
                        <td>
                          {r.hasBacklog ? (
                            r.isCleared ? <Badge variant="success">Cleared</Badge> : <Badge variant="danger">Pending</Badge>
                          ) : (
                            <span className="text-surface-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Career Outcome */}
            {selectedStudent.careerOutcome && (
              <div>
                <h3 className="text-sm font-semibold text-surface-300 mb-3">Career Outcome</h3>
                <div className="glass-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-surface-500">Type</p>
                    <Badge variant={selectedStudent.careerOutcome.outcomeType === 'PLACEMENT' ? 'success' : 'info'}>
                      {selectedStudent.careerOutcome.outcomeType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500">Organization</p>
                    <p className="text-sm text-surface-200">{selectedStudent.careerOutcome.organization}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500">Reference</p>
                    <p className="text-sm text-surface-400 font-mono">{selectedStudent.careerOutcome.appointmentRef || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500">Date</p>
                    <p className="text-sm text-surface-400">{selectedStudent.careerOutcome.outcomeDate || '—'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Promote Confirmation Modal */}
      <Modal isOpen={showPromoteConfirm} onClose={() => setShowPromoteConfirm(false)} title="Confirm Cohort Promotion" size="sm">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-warning-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-warning-400" />
          </div>
          <p className="text-surface-200 mb-2">
            This will promote all eligible enrolled students in the selected batch.
          </p>
          <p className="text-sm text-surface-400 mb-6">
            Students with uncleared backlogs will be flagged as <span className="text-danger-400 font-semibold">Detained</span>.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setShowPromoteConfirm(false)} className="px-4 py-2 rounded-xl bg-white/5 text-surface-300 text-sm">
              Cancel
            </button>
            <button
              onClick={handlePromote}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-accent-600 to-accent-500 text-white text-sm font-semibold"
              id="confirm-promote-btn"
            >
              Promote Cohort
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
