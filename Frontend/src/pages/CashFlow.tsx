import React, { useEffect, useState } from 'react'
import { Card, Alert, Button } from '../components'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'

export const CashFlow: React.FC = () => {
  const { state, setLoading, setError } = useApp()
  const [cashFlow, setCashFlow] = useState<any>(null)

  const [startDate, setStartDate] = useState('2024-09-01')
  const [endDate, setEndDate] = useState('2025-02-28')

  useEffect(() => {
    if (state.selectedEntityId) loadCashFlow()
  }, [state.selectedEntityId, startDate, endDate])

  const loadCashFlow = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getCashFlow(
        state.selectedEntityId!,
        startDate,
        endDate
      )
      setCashFlow(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load cash flow')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    const abs = Math.abs(amount)
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(abs)
    return amount < 0 ? `(${formatted})` : formatted
  }

  const SectionTable = ({
    title,
    items,
    total,
    color,
  }: {
    title: string
    items: any[]
    total: number
    color: string
  }) => (
    <Card>
      <h2 className={`text-xl font-bold mb-4 ${color}`}>{title}</h2>
      {items && items.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 text-gray-600 dark:text-gray-400 font-medium">Description</th>
              <th className="text-right py-2 text-gray-600 dark:text-gray-400 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="py-2 text-gray-700 dark:text-gray-300">{item.description || item.category}</td>
                <td className={`py-2 text-right font-medium ${item.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatAmount(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 dark:border-gray-600">
              <td className="py-3 font-bold text-gray-800 dark:text-gray-100">Net {title}</td>
              <td className={`py-3 text-right font-bold text-lg ${total < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatAmount(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No transactions in this category.</p>
      )}
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Cash Flow Statement</h1>
        <Button onClick={loadCashFlow} variant="secondary">
          🔄 Refresh
        </Button>
      </div>

      {state.error && <Alert variant="danger" icon="✕">{state.error}</Alert>}

      {/* Date Filters */}
      <Card>
        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Filter by Period</h3>
        <div className="flex gap-4 flex-wrap items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Preset buttons — each sets a distinct range within seed data window */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStartDate('2025-02-01')
                setEndDate('2025-02-28')
              }}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium"
            >
              This Month
            </button>
            <button
              onClick={() => {
                setStartDate('2024-12-01')
                setEndDate('2025-02-28')
              }}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium"
            >
              This Quarter
            </button>
            <button
              onClick={() => {
                setStartDate('2024-09-01')
                setEndDate('2025-02-28')
              }}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium"
            >
              YTD
            </button>
          </div>

          <Button onClick={loadCashFlow} variant="primary">Apply</Button>
        </div>
      </Card>

      {state.loading && (
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading cash flow data...</p>
        </Card>
      )}

      {cashFlow && !state.loading && (
        <>
          {/* Net Cash Summary */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Operating</p>
                <p className={`text-2xl font-bold ${(cashFlow.operating?.total ?? 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatAmount(cashFlow.operating?.total ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Investing</p>
                <p className={`text-2xl font-bold ${(cashFlow.investing?.total ?? 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatAmount(cashFlow.investing?.total ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Financing</p>
                <p className={`text-2xl font-bold ${(cashFlow.financing?.total ?? 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatAmount(cashFlow.financing?.total ?? 0)}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-gray-300 dark:border-gray-600 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Cash Movement</p>
              <p className={`text-3xl font-bold ${((cashFlow.operating?.total ?? 0) + (cashFlow.investing?.total ?? 0) + (cashFlow.financing?.total ?? 0)) < 0
                  ? 'text-red-600' : 'text-green-600'
                }`}>
                {formatAmount(
                  (cashFlow.operating?.total ?? 0) +
                  (cashFlow.investing?.total ?? 0) +
                  (cashFlow.financing?.total ?? 0)
                )}
              </p>
            </div>
          </Card>

          {/* Sections */}
          <SectionTable
            title="Operating Activities"
            items={cashFlow.operating?.items ?? []}
            total={cashFlow.operating?.total ?? 0}
            color="text-blue-700"
          />
          <SectionTable
            title="Investing Activities"
            items={cashFlow.investing?.items ?? []}
            total={cashFlow.investing?.total ?? 0}
            color="text-purple-700"
          />
          <SectionTable
            title="Financing Activities"
            items={cashFlow.financing?.items ?? []}
            total={cashFlow.financing?.total ?? 0}
            color="text-orange-700"
          />
        </>
      )}

      {!cashFlow && !state.loading && (
        <Alert variant="info" icon="ℹ️">
          Select a date range and click Apply to load the cash flow statement.
        </Alert>
      )}
    </div>
  )
}