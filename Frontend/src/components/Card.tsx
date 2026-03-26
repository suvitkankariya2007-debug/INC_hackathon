import { useCountUp, formatCurrency } from '../hooks/useCountUp'

// ─── Card ────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  glass?: boolean
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, glass }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl p-6 transition-all duration-200 animate-slideInUp ${
      onClick ? 'cursor-pointer card-interactive' : ''
    } ${glass ? 'glass' : ''} ${className}`}
    style={{
      background: glass ? undefined : 'var(--surface)',
      border: `1px solid var(--border)`,
      boxShadow: 'var(--card-shadow)',
    }}
  >
    {children}
  </div>
)

// ─── Skeleton ─────────────────────────────────────────────────
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton rounded-xl ${className}`} />
)

// ─── StatCard ─────────────────────────────────────────────────
interface StatCardProps {
  title: string
  value: string | number
  rawValue?: number
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo'
  trend?: number
  subtitle?: string
  loading?: boolean
  sparkline?: number[]
}

const colorConfig = {
  blue:   { gradient: 'from-blue-500 to-cyan-500',    bg: 'bg-blue-50 dark:bg-blue-950/40',   text: 'text-blue-600 dark:text-blue-400',   ring: 'ring-blue-100 dark:ring-blue-900' },
  green:  { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-100 dark:ring-emerald-900' },
  red:    { gradient: 'from-red-500 to-rose-500',     bg: 'bg-red-50 dark:bg-red-950/40',     text: 'text-red-600 dark:text-red-400',     ring: 'ring-red-100 dark:ring-red-900' },
  yellow: { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-100 dark:ring-amber-900' },
  purple: { gradient: 'from-purple-500 to-pink-500',  bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-100 dark:ring-purple-900' },
  indigo: { gradient: 'from-indigo-500 to-violet-500',bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-100 dark:ring-indigo-900' },
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, value, rawValue, icon, color = 'blue', trend, subtitle, loading, sparkline 
}) => {
  const c = colorConfig[color]
  const animatedValue = useCountUp(rawValue || 0)
  
  if (loading) {
    return (
      <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="flex justify-between items-end mt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    )
  }

  // If rawValue is provided, format the animated version. Otherwise use the string 'value'
  const displayValue = rawValue !== undefined 
    ? (title.toLowerCase().includes('transaction') || title.toLowerCase().includes('anomal') ? animatedValue : formatCurrency(animatedValue))
    : value

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 card-interactive animate-slideInUp stat-card-glow"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
    >
      {/* Top accent bar */}
      <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${c.gradient} mb-4`} />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold truncate transition-all duration-300" style={{ color: 'var(--text-primary)' }}>
              {displayValue}
            </p>
          </div>
          
          {subtitle && (
            <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          )}

          {/* Mini Sparkline SVG */}
          <div className="h-6 mt-3 mb-1 w-full opacity-40">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
              <path
                d={`M 0 25 Q 25 ${Math.random()*15+5} 50 15 T 100 ${Math.random()*10+5}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={trend !== undefined && trend < 0 ? 'text-red-500' : 'text-emerald-500'}
              />
            </svg>
          </div>

          {trend !== undefined && (
            <p className={`text-[11px] font-bold flex items-center gap-1 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              <span className="text-base">{trend >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}% vs last month</span>
            </p>
          )}
        </div>
        {icon && (
          <div className={`ml-3 flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl ring-4 ${c.bg} ${c.ring} shadow-lg shadow-black/5`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}


// ─── Alert ────────────────────────────────────────────────────
interface AlertProps {
  children: React.ReactNode
  variant?: 'info' | 'success' | 'warning' | 'danger'
  icon?: React.ReactNode
  className?: string
}

const alertConfig = {
  info:    { bg: 'bg-blue-50 dark:bg-blue-950/40',    border: 'border-blue-200 dark:border-blue-800',    text: 'text-blue-800 dark:text-blue-200' },
  success: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-800 dark:text-emerald-200' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-950/40',  border: 'border-amber-200 dark:border-amber-800',  text: 'text-amber-800 dark:text-amber-200' },
  danger:  { bg: 'bg-red-50 dark:bg-red-950/40',      border: 'border-red-200 dark:border-red-800',      text: 'text-red-800 dark:text-red-200' },
}

export const Alert: React.FC<AlertProps> = ({ children, variant = 'info', icon, className = '' }) => {
  const a = alertConfig[variant]
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${a.bg} ${a.border} ${a.text} ${className} animate-fadeIn`}>
      {icon && <span className="flex-shrink-0 mt-0.5">{icon}</span>}
      <span>{children}</span>
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'info'
  size?: 'sm' | 'md'
}

const badgeConfig = {
  primary:   'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
  success:   'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
  warning:   'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
  danger:    'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  info:      'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', size = 'sm' }) => (
  <span className={`inline-flex items-center font-semibold rounded-lg ${
    size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  } ${badgeConfig[variant]}`}>
    {children}
  </span>
)

// ─── TransactionTypeBadge ─────────────────────────────────────
export const TransactionTypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <Badge variant={type === 'credit' ? 'success' : 'danger'}>
    {type === 'credit' ? '↑ Credit' : '↓ Debit'}
  </Badge>
)

// ─── StatusBadge ─────────────────────────────────────────────
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, 'success' | 'warning' | 'secondary'> = {
    matched: 'success',
    possible: 'warning',
    unmatched: 'secondary',
  }
  return <Badge variant={map[status] || 'secondary'}>{status}</Badge>
}

// ─── Amount ───────────────────────────────────────────────────
export const Amount: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => (
  <span className={`font-semibold tabular-nums ${value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} ${className}`}>
    ₹{Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </span>
)

