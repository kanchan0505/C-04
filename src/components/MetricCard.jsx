import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, color = 'primary', onClick }) {
  const colorMap = {
    primary: {
      bg: 'from-primary-500/10 to-primary-600/5',
      border: 'border-primary-500/20',
      icon: 'text-primary-400 bg-primary-500/10',
      glow: 'glow-primary',
      value: 'text-primary-300',
    },
    accent: {
      bg: 'from-accent-500/10 to-accent-600/5',
      border: 'border-accent-500/20',
      icon: 'text-accent-400 bg-accent-500/10',
      glow: 'glow-accent',
      value: 'text-accent-300',
    },
    warning: {
      bg: 'from-warning-500/10 to-warning-500/5',
      border: 'border-warning-500/20',
      icon: 'text-warning-400 bg-warning-500/10',
      glow: 'glow-warning',
      value: 'text-warning-300',
    },
    danger: {
      bg: 'from-danger-500/10 to-danger-500/5',
      border: 'border-danger-500/20',
      icon: 'text-danger-400 bg-danger-500/10',
      glow: '',
      value: 'text-danger-300',
    },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <div
      className={`glass-card p-6 bg-gradient-to-br ${c.bg} border ${c.border} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${c.icon}`}>
          {Icon && <Icon size={20} />}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend > 0 ? 'text-accent-400' : trend < 0 ? 'text-danger-400' : 'text-surface-400'}`}>
            {trend > 0 ? <TrendingUp size={14} /> : trend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className={`text-3xl font-bold ${c.value} mb-1 tracking-tight`}>{value}</div>
      <div className="text-sm font-medium text-surface-300">{title}</div>
      {subtitle && <div className="text-xs text-surface-500 mt-1">{subtitle}</div>}
    </div>
  );
}
