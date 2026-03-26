import React from 'react'

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
    const [sortKey, setSortKey] = React.useState<string | null>(null)
    const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc')

    const handleSort = (key: string) => {
      if (sortKey === key) {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        setSortDir('asc')
      }
    }

    const sortedData = React.useMemo(() => {
      if (!sortKey) return data
      return [...data].sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av ?? '').localeCompare(String(bv ?? ''))
        return sortDir === 'asc' ? cmp : -cmp
      })
    }, [data, sortKey, sortDir])

    if (isLoading) {
      return (
        <div className="space-y-3 p-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      )
    }

    if (sortedData.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-30">📭</div>
          <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No data available</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters</p>
        </div>
      )
    }

    return (
      <div className={`overflow-x-auto rounded-2xl ${className}`} style={{ border: '1px solid var(--border)' }}>
        <table ref={ref} className="w-full" style={{ background: 'var(--surface)' }}>
          <thead style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === String(col.key)
                return (
                  <th
                    key={String(col.key)}
                    className="px-5 py-3.5 text-left sort-header"
                    style={{ color: isSorted ? 'var(--accent)' : 'var(--text-muted)' }}
                    onClick={() => handleSort(String(col.key))}
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                      {col.label}
                      <span className="text-[10px] transition-all duration-200" style={{ opacity: isSorted ? 1 : 0.3 }}>
                        {isSorted ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr
                key={String(row[rowKey]) || idx}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className={`px-5 py-3.5 text-sm ${col.className || ''}`} style={{ color: 'var(--text-secondary)' }}>
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

// Category with confidence
export const CategoryWithConfidence: React.FC<{ category: string; confidence?: number }> = ({
  category,
  confidence,
}) => (
  <div>
    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{category}</p>
    {confidence !== undefined && (
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {(confidence * 100).toFixed(0)}% confidence
      </p>
    )}
  </div>
)
