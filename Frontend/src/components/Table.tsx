import React from 'react'
import { Badge } from './FormElements'

interface TableColumn<T> {
  key: keyof T
  label: string
  render?: (value: any, row: T) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  className?: string
  isLoading?: boolean
  onRowClick?: (row: T) => void
  rowKey: keyof T
}

export const Table = React.forwardRef<HTMLTableElement, TableProps<any>>(
  ({ columns, data, className = '', isLoading = false, onRowClick, rowKey }, ref) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin text-3xl">⟳</div>
        </div>
      )
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No data available</p>
        </div>
      )
    }

    return (
      <div className={`overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
        <table ref={ref} className="w-full bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={String(row[rowKey]) || idx}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className={`px-6 py-4 text-sm text-gray-700 ${col.className || ''}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
)

Table.displayName = 'Table'

// Status badge renderer
export const StatusBadge: React.FC<{ status: string }> = ({ status = 'unmatched' }) => {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    matched: 'success',
    possible: 'warning',
    unmatched: 'danger',
    active: 'success',
    inactive: 'danger',
  }
  return <Badge variant={variants[status] || 'info'}>{status}</Badge>
}

// Transaction type badge
export const TransactionTypeBadge: React.FC<{ type: string }> = ({ type = 'debit' }) => {
  const variant = type === 'debit' ? 'danger' : 'success'
  return <Badge variant={variant}>{type.toUpperCase()}</Badge>
}

// Category with confidence
export const CategoryWithConfidence: React.FC<{ category: string; confidence?: number }> = ({
  category,
  confidence,
}) => (
  <div>
    <p className="font-medium text-gray-700">{category}</p>
    {confidence !== undefined && (
      <p className="text-xs text-gray-500">
        {(confidence * 100).toFixed(0)}% confidence
      </p>
    )}
  </div>
)

// Amount formatter
export const Amount: React.FC<{ value: number; color?: boolean }> = ({ value, color = true }) => {
  const isNegative = value < 0
  return (
    <span className={color && isNegative ? 'text-red-600 font-semibold' : 'text-gray-700'}>
      ₹{Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
    </span>
  )
}
