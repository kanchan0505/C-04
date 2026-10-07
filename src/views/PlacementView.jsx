import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBatches } from '@/store/batchSlice';
import DataTable from '@/components/DataTable';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { Briefcase, Plus, AlertTriangle, CheckCircle, Building2, GraduationCap, Rocket } from 'lucide-react';

export default function PlacementView() {
  const dispatch = useDispatch();
  const { items: batches } = useSelector(state => state.batches);

  const [selectedBatch, setSelectedBatch] = useState('');
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    rollNumber: '',
    outcomeType: 'PLACEMENT',
    organization: '',
    appointmentRef: '',
    outcomeDate: '',
  });
  const [submitResult, setSubmitResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    dispatch(fetchBatches());
  }, [dispatch]);

  const fetchPlacements = useCallback(async (batchId) => {
    if (!batchId) { setPlacements([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/placement?batchId=${batchId}`);
      const data = await res.json();
      setPlacements(Array.isArray(data) ? data : []);
    } catch {
      setPlacements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBatch) fetchPlacements(selectedBatch);
  }, [selectedBatch, fetchPlacements]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitResult(null);

    try {
      const res = await fetch('/api/placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error);
        return;
      }

      setSubmitResult('Career outcome added successfully');
      setFormData({ rollNumber: '', outcomeType: 'PLACEMENT', organization: '', appointmentRef: '', outcomeDate: '' });
      if (selectedBatch) fetchPlacements(selectedBatch);

      setTimeout(() => setShowAddModal(false), 1500);
    } catch (err) {
      setSubmitError(err.message);
    }
  }, [formData, selectedBatch, fetchPlacements]);

  const outcomeIcon = (type) => {
    switch (type) {
      case 'PLACEMENT': return <Building2 size={14} className="text-accent-400" />;
      case 'HIGHER_STUDIES': return <GraduationCap size={14} className="text-primary-400" />;
      case 'ENTREPRENEURSHIP': return <Rocket size={14} className="text-warning-400" />;
      default: return null;
    }
  };

  const outcomeBadge = (type) => {
    const map = {
      PLACEMENT: { variant: 'success', label: 'Placement' },
      HIGHER_STUDIES: { variant: 'info', label: 'Higher Studies' },
      ENTREPRENEURSHIP: { variant: 'warning', label: 'Entrepreneurship' },
    };
    const o = map[type] || { variant: 'info', label: type };
    return <Badge variant={o.variant}>{o.label}</Badge>;
  };

  // Summary stats
  const placedCount = placements.filter(p => p.outcomeType === 'PLACEMENT').length;
  const higherCount = placements.filter(p => p.outcomeType === 'HIGHER_STUDIES').length;
  const entrepreneurCount = placements.filter(p => p.outcomeType === 'ENTREPRENEURSHIP').length;

  const columns = [
    {
      header: 'Roll Number',
      render: (row) => <span className="font-mono text-primary-400 text-sm">{row.student?.rollNumber}</span>,
    },
    {
      header: 'Student Name',
      render: (row) => <span className="font-medium text-surface-200">{row.student?.name}</span>,
    },
    {
      header: 'Outcome',
      render: (row) => (
        <div className="flex items-center gap-2">
          {outcomeIcon(row.outcomeType)}
          {outcomeBadge(row.outcomeType)}
        </div>
      ),
    },
    { header: 'Organization', render: (row) => <span className="text-surface-300">{row.organization}</span> },
    {
      header: 'Reference',
      render: (row) => <span className="font-mono text-xs text-surface-400">{row.appointmentRef || '—'}</span>,
    },
    {
      header: 'Date',
      render: (row) => <span className="text-sm text-surface-400">{row.outcomeDate || '—'}</span>,
    },
    {
      header: 'Validation',
      render: (row) => {
        const status = row.student?.currentStatus;
        if (status === 'GRADUATED' || status === 'ENROLLED') {
          return <CheckCircle size={16} className="text-accent-400" />;
        }
        return (
          <div className="flex items-center gap-1.5" title={`Status: ${status}`}>
            <AlertTriangle size={16} className="text-warning-400" />
            <span className="text-xs text-warning-400">Mismatch</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Placement Management</h1>
          <p className="text-surface-400 text-sm">Manage placement cell records, higher studies, and entrepreneurship outcomes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20"
          id="add-placement-btn"
        >
          <Plus size={16} />
          Add Outcome
        </button>
      </div>

      {/* Batch Selector + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <label className="block text-xs text-surface-500 mb-2 font-medium">Select Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50"
            id="placement-batch-select"
          >
            <option value="">Choose batch...</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.batchCode}</option>
            ))}
          </select>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-accent-500/10 text-accent-400"><Building2 size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-accent-300">{placedCount}</p>
            <p className="text-xs text-surface-400">Placed</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400"><GraduationCap size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-primary-300">{higherCount}</p>
            <p className="text-xs text-surface-400">Higher Studies</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-warning-500/10 text-warning-400"><Rocket size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-warning-300">{entrepreneurCount}</p>
            <p className="text-xs text-surface-400">Entrepreneurs</p>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={placements}
          emptyMessage={selectedBatch ? 'No placement records for this batch.' : 'Select a batch to view placement records.'}
        />
      )}

      {/* Add Outcome Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setSubmitError(null); setSubmitResult(null); }} title="Add Career Outcome" size="md">
        <form onSubmit={handleSubmit} className="space-y-5">
          {submitError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-500/10 border border-danger-500/20">
              <AlertTriangle size={16} className="text-danger-400 shrink-0" />
              <p className="text-sm text-danger-400">{submitError}</p>
            </div>
          )}
          {submitResult && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-500/10 border border-accent-500/20">
              <CheckCircle size={16} className="text-accent-400 shrink-0" />
              <p className="text-sm text-accent-400">{submitResult}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Roll Number *</label>
            <input
              type="text"
              value={formData.rollNumber}
              onChange={(e) => setFormData(f => ({ ...f, rollNumber: e.target.value }))}
              placeholder="e.g., 0832CS20001"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50 placeholder-surface-600"
              required
              id="placement-roll-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Outcome Type *</label>
            <select
              value={formData.outcomeType}
              onChange={(e) => setFormData(f => ({ ...f, outcomeType: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50"
              id="placement-type-select"
            >
              <option value="PLACEMENT">Placement</option>
              <option value="HIGHER_STUDIES">Higher Studies</option>
              <option value="ENTREPRENEURSHIP">Entrepreneurship</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Organization *</label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData(f => ({ ...f, organization: e.target.value }))}
              placeholder="Company, University, or Venture name"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50 placeholder-surface-600"
              required
              id="placement-org-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Reference No.</label>
              <input
                type="text"
                value={formData.appointmentRef}
                onChange={(e) => setFormData(f => ({ ...f, appointmentRef: e.target.value }))}
                placeholder="Appointment letter ref"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50 placeholder-surface-600"
                id="placement-ref-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Date</label>
              <input
                type="date"
                value={formData.outcomeDate}
                onChange={(e) => setFormData(f => ({ ...f, outcomeDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-surface-200 text-sm focus:outline-none focus:border-primary-500/50"
                id="placement-date-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-white/5 text-surface-300 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold hover:from-primary-500 hover:to-primary-400 transition-all"
              id="submit-placement-btn"
            >
              <Plus size={16} />
              Add Outcome
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
