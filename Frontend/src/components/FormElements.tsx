import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
    <div className="relative">
      {icon && <div className="absolute left-3 top-3 text-gray-400">{icon}</div>}
      <input
        className={`
          w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
          ${icon ? 'pl-10' : ''}
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
    </div>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
)

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
    {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
    <select
      className={`
        w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
        ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
        ${className}
      `}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
)

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const badgeVariants = {
  primary: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-gray-100 text-gray-800',
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className = '' }) => (
  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badgeVariants[variant]} ${className}`}>
    {children}
  </span>
)

type AlertVariant = 'success' | 'warning' | 'danger' | 'info'

interface AlertProps {
  children: React.ReactNode
  variant?: AlertVariant
  icon?: React.ReactNode
  onClose?: () => void
  className?: string
}

const alertVariants = {
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

export const Alert: React.FC<AlertProps> = ({ children, variant = 'info', icon, onClose, className = '' }) => (
  <div className={`border rounded-lg p-4 flex items-start gap-3 animate-slideInUp ${alertVariants[variant]} ${className}`}>
    {icon && <div className="text-xl mt-0.5">{icon}</div>}
    <div className="flex-1">{children}</div>
    {onClose && (
      <button
        onClick={onClose}
        className="text-xl cursor-pointer hover:opacity-70 transition-opacity ml-2"
      >
        ✕
      </button>
    )}
  </div>
)
