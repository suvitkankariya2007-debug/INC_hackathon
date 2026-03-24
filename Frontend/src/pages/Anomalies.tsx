import React, { useEffect } from 'react'
import { Card, Table, Amount, Badge, Alert, Button } from '../components'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'


export const Anomalies: React.FC = () => {
  const { state, setAnomalies, setLoading, setError } = useApp()
  const [sortBy, setSortBy] = React.useState<'date' | 'amount' | 'severity'>('date')

  useEffect(() => {
    loadAnomalies()
  }, [state.selectedEntityId])

  const loadAnomalies = async () => {
    try {
      setLoading(true)
      const anomalies = await apiClient.getAnomalies(state.selectedEntityId || 1)
      setAnomalies(anomalies)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load anomalies')
    } finally {
      setLoading(false)
    }
  }

  const getSeverity = (reason: string): 'high' | 'medium' | 'low' => {
    if (reason.includes('sigma')) return 'high'
    if (reason.includes('Duplicate')) return 'medium'
    return 'low'
  }

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return 'danger'
      case 'medium':
        return 'warning'
      case 'low':
        return 'info'
    }
  }

  const sortedAnomalies = [...state.anomalies].sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return b.amount - a.amount
      case 'severity':
        const severityOrder = { high: 3, medium: 2, low: 1 }
        return severityOrder[getSeverity(b.anomaly_reason)] - severityOrder[getSeverity(a.anomaly_reason)]
      case 'date':
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
  })

  const columns = [
    {
      key: 'date' as const,
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'description' as const,
      label: 'Description',
      render: (value: string) => <span className="max-w-xs truncate">{value}</span>,
    },
    {
      key: 'amount' as const,
      label: 'Amount',
      render: (value: number) => <Amount value={value} color={true} />,
    },
    {
      key: 'anomaly_reason' as const,
      label: 'Reason',
      render: (value: string) => (
        <div className="w-64">
          <p className="text-sm font-medium text-gray-700">{value}</p>
          <Badge variant={getSeverityColor(getSeverity(value))} className="mt-2">
            {getSeverity(value).toUpperCase()}
          </Badge>
        </div>
      ),
    },
  ]

  const anomalyTypeBreakdown = state.anomalies.reduce(
    (acc, anomaly) => {
      if (anomaly.anomaly_reason.includes('sigma')) acc.statistical++
      else if (anomaly.anomaly_reason.includes('Duplicate')) acc.duplicate++
      else if (anomaly.anomaly_reason.includes('pattern')) acc.pattern++
      else acc.logical++
      return acc
    },
    { statistical: 0, duplicate: 0, logical: 0, pattern: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Anomaly Detection</h1>
        <Button onClick={loadAnomalies} variant="secondary">
          🔄 Refresh
        </Button>
      </div>

      {state.error && <Alert variant="danger" icon="✕">{state.error}</Alert>}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{state.anomalies.length}</p>
            <p className="text-sm text-gray-600 mt-2">Total Anomalies</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">{anomalyTypeBreakdown.statistical}</p>
            <p className="text-sm text-gray-600 mt-2">Statistical</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{anomalyTypeBreakdown.duplicate}</p>
            <p className="text-sm text-gray-600 mt-2">Duplicates</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{anomalyTypeBreakdown.pattern}</p>
            <p className="text-sm text-gray-600 mt-2">Patterns</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600">{anomalyTypeBreakdown.logical}</p>
            <p className="text-sm text-gray-600 mt-2">Logical</p>
          </div>
        </Card>
      </div>

      {/* Detection Methods Info */}
      <Card>
        <h3 className="text-lg font-bold mb-4 text-gray-800">How We Detect Anomalies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-orange-50 rounded-lg">
            <h4 className="font-semibold text-orange-800 mb-2">📊 Statistical Outliers</h4>
            <p className="text-sm text-orange-700">
              Amounts more than 3 standard deviations from category mean (0.15% outliers)
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">📋 Duplicate Detection</h4>
            <p className="text-sm text-yellow-700">
              Identical description and amount within 2-day windows
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">🔗 Pattern Analysis</h4>
            <p className="text-sm text-purple-700">
              Behavioral clustering and unusual payment patterns detected
            </p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h4 className="font-semibold text-indigo-800 mb-2">✓ Logical Rules</h4>
            <p className="text-sm text-indigo-700">
              Validates transaction type vs account type combinations
            </p>
          </div>
        </div>
      </Card>

      {/* Sort Controls */}
      <Card>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSortBy('date')}
            className={`px-4 py-2 rounded-lg transition ${sortBy === 'date'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Sort by Date
          </button>
          <button
            onClick={() => setSortBy('amount')}
            className={`px-4 py-2 rounded-lg transition ${sortBy === 'amount'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Sort by Amount
          </button>
          <button
            onClick={() => setSortBy('severity')}
            className={`px-4 py-2 rounded-lg transition ${sortBy === 'severity'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Sort by Severity
          </button>
        </div>
      </Card>

      {/* Anomalies Table */}
      <Card>
        <Table
          columns={columns}
          data={sortedAnomalies}
          isLoading={state.loading}
          rowKey="id"
        />
      </Card>

      {state.anomalies.length === 0 && !state.loading && (
        <Alert variant="success" icon="✓">
          No anomalies detected! Your transactions look normal.
        </Alert>
      )}
    </div>
  )
}
