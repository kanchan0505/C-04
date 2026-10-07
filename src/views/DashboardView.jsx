import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard } from '@/store/dashboardSlice';
import MetricCard from '@/components/MetricCard';
import DataTable from '@/components/DataTable';
import { Users, GraduationCap, Briefcase, BarChart3, TrendingUp, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function DashboardView() {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector(state => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  if (loading || !stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Dashboard</h1>
          <p className="text-surface-400">Loading system metrics...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const readinessScore = stats.totalStudents > 0
    ? Math.round((stats.graduatedStudents / stats.totalStudents) * 100)
    : 0;

  const placementIndex = stats.totalStudents > 0
    ? ((stats.placedStudents / Math.max(1, stats.graduatedStudents)) * 100).toFixed(1)
    : '0.0';

  const batchColumns = [
    { header: 'Batch', accessor: 'batchCode', width: '15%' },
    { header: 'Admission Year', accessor: 'admissionYear', width: '15%' },
    { header: 'Graduation Year', accessor: 'graduationYear', width: '15%' },
    { header: 'Sanctioned Intake', accessor: 'sanctionedIntake', width: '15%' },
    { header: 'Regular', accessor: 'regularAdmitted', width: '12%' },
    { header: 'Lateral', accessor: 'lateralAdmitted', width: '12%' },
    {
      header: 'Students',
      accessor: 'studentCount',
      width: '16%',
      render: (row) => (
        <span className="font-semibold text-primary-400">{row.studentCount}</span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Dashboard</h1>
          <p className="text-surface-400 text-sm">
            NBA Criteria 4 Automation System — Overview & Quick Stats
          </p>
        </div>
        <Link
          href="/report"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40"
          id="view-report-btn"
        >
          <BarChart3 size={16} />
          View NBA Report
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Enrolled"
          value={stats.totalStudents.toLocaleString()}
          subtitle="Across all batches"
          icon={Users}
          color="primary"
        />
        <MetricCard
          title="Completed Batches"
          value={stats.totalBatches}
          subtitle="Active & graduated"
          icon={BookOpen}
          color="accent"
        />
        <MetricCard
          title="Placement Index"
          value={`${placementIndex}%`}
          subtitle={`${stats.placedStudents} students placed`}
          icon={Briefcase}
          color="warning"
        />
        <MetricCard
          title="Readiness Score"
          value={`${readinessScore}%`}
          subtitle="Graduation completion rate"
          icon={TrendingUp}
          color={readinessScore >= 70 ? 'accent' : readinessScore >= 50 ? 'warning' : 'danger'}
        />
      </div>

      {/* Batches Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Batch Overview</h2>
          <span className="text-xs text-surface-500">{stats.batches?.length || 0} batches</span>
        </div>
        <DataTable
          columns={batchColumns}
          data={stats.batches || []}
          emptyMessage="No batches found. Upload data to get started."
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/upload" className="glass-card p-5 flex items-center gap-4 group hover:border-primary-500/30">
          <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400 group-hover:bg-primary-500/20 transition-colors">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Upload Results</p>
            <p className="text-xs text-surface-500">Import semester Excel files</p>
          </div>
        </Link>
        <Link href="/students" className="glass-card p-5 flex items-center gap-4 group hover:border-accent-500/30">
          <div className="p-3 rounded-xl bg-accent-500/10 text-accent-400 group-hover:bg-accent-500/20 transition-colors">
            <Users size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Student Directory</p>
            <p className="text-xs text-surface-500">View & manage student records</p>
          </div>
        </Link>
        <Link href="/placement" className="glass-card p-5 flex items-center gap-4 group hover:border-warning-500/30">
          <div className="p-3 rounded-xl bg-warning-500/10 text-warning-400 group-hover:bg-warning-500/20 transition-colors">
            <Briefcase size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Placement Data</p>
            <p className="text-xs text-surface-500">Manage placement outcomes</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
