import React from 'react'

// ─── Input ───────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>{icon}</div>
      )}
      <input
        className={`
          w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
          ${icon ? 'pl-10' : ''}
          ${error ? 'border-red-400 dark:border-red-600' : ''}
          ${className}
        `}
        style={{
          background: 'var(--bg-tertiary)',
          border: `1.5px solid ${error ? '' : 'var(--border)'}`,
          color: 'var(--text-primary)',
        }}
        {...props}
      />
    </div>
    {error && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium">{error}</p>}
  </div>
)

// ─── Select ──────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string | number; label: string }>
  placeholder?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  placeholder,
  className = '',
  ...props
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
    )}
    <select
      className={`
        w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
        ${error ? 'border-red-400 dark:border-red-600' : ''}
        ${className}
      `}
      style={{
        background: 'var(--bg-tertiary)',
        border: `1.5px solid var(--border)`,
        color: 'var(--text-primary)',
      }}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium">{error}</p>}
  </div>
)

