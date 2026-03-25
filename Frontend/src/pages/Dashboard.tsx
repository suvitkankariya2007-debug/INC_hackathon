import React, { useEffect, useState } from 'react'
import { Card, StatCard, Alert, Badge } from '../components'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'
import { AnomalyAlert, Transaction } from '../types'

export const Dashboard: React.FC = () => {
  const { state, setMonthlyTrends, setAnomalies, setLoading, setError } = useApp()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({
    total: 0,
    anomalies: 0,
    revenue: 0,
    expense: 0,
  })

  useEffect(() => {
    loadDashboardData()
  }, [state.selectedEntityId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const entityId = state.selectedEntityId || 1

      const txRes = await apiClient.getTransactions({
        entity_id: entityId,
        limit: 100,
      })
      setTransactions(txRes.items)

      const anomalies = await apiClient.getAnomalies(entityId)
      setAnomalies(anomalies)

      const trends = await apiClient.getMonthlyTrend(entityId)
      setMonthlyTrends(trends)

      calculateStats(txRes.items, anomalies)

      setError(null)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (txs: Transaction[], anomalies: AnomalyAlert[]) => {
    let revenue = 0
    let expense = 0

    txs.forEach((tx) => {
      if (tx.transaction_type === 'credit') {
        revenue += tx.amount
      } else {
        expense += tx.amount
      }
    })

    setStats({
      total: txs.length,
      anomalies: anomalies.length,
      revenue,
      expense,
    })
  }

  const aiStats = (() => {
    const classified = transactions.filter((tx) => tx.ai_category || tx.category)
    const withAI = transactions.filter((tx) => tx.ai_category)
    const highConfidence = transactions.filter((tx) => tx.ai_confidence && tx.ai_confidence > 0.8)
    const overridden = transactions.filter((tx) => tx.ai_overridden)

    return {
      totalClassified: classified.length,
      aiClassified: withAI.length,
      highConfidence: highConfidence.length,
      overridden: overridden.length,
      unclassified: transactions.length - classified.length,
      avgConfidence: withAI.length > 0
        ? withAI.reduce((sum, tx) => sum + (tx.ai_confidence || 0), 0) / withAI.length
        : 0,
    }
  })()

  const reconcileStats = (() => {
    const matched = transactions.filter((tx) => tx.reconcile_status === 'matched').length
    const possible = transactions.filter((tx) => tx.reconcile_status === 'possible').length
    const unmatched = transactions.filter(
      (tx) => !tx.reconcile_status || tx.reconcile_status === 'unmatched'
    ).length

    return { matched, possible, unmatched }
  })()

  const reconcileData = [
    { name: 'Matched', value: reconcileStats.matched, color: '#10B981' },
    { name: 'Possible', value: reconcileStats.possible, color: '#F59E0B' },
    { name: 'Unmatched', value: reconcileStats.unmatched, color: '#8B5CF6' },
  ].filter(d => d.value > 0)

  // --- UPDATED CATEGORY BREAKDOWN LOGIC ---
  const categoryBreakdown = (() => {
    const rawData = transactions
      .filter((tx) => tx.category)
      .reduce((acc, tx) => {
        const existing = acc.find((item) => item.name === tx.category)
        if (existing) {
          existing.value += tx.amount
        } else {
          acc.push({ name: tx.category!, value: tx.amount })
        }
        return acc
      }, [] as Array<{ name: string; value: number }>)

    if (rawData.length === 0) return []

    const totalValue = rawData.reduce((sum, item) => sum + item.value, 0)
    const threshold = totalValue * 0.05 // 5% threshold to group into "Other"

    const mainCategories = rawData.filter(item => item.value >= threshold)
    const otherValue = rawData
      .filter(item => item.value < threshold)
      .reduce((sum, item) => sum + item.value, 0)

    const finalData = [...mainCategories].sort((a, b) => b.value - a.value)
    
    if (otherValue > 0) {
      finalData.push({ name: 'Other', value: otherValue })
    }

    return finalData
  })()

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

  const anomalyBreakdown = state.anomalies.reduce(
    (acc, anomaly) => {
      if (anomaly.anomaly_reason.includes('sigma')) {
        acc.statistical.push(anomaly)
      } else if (anomaly.anomaly_reason.includes('Duplicate')) {
        acc.duplicate.push(anomaly)
      } else {
        acc.logical.push(anomaly)
      }
      return acc
    },
    { statistical: [] as AnomalyAlert[], duplicate: [] as AnomalyAlert[], logical: [] as AnomalyAlert[] }
  )

  return (
    <div className="space-y-8">
      {state.error && (
        <Alert variant="danger" icon="✕">
          {state.error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Transactions" value={stats.total} icon="💳" color="blue" />
        <StatCard title="Anomalies Detected" value={stats.anomalies} icon="⚠️" color="red" trend={-15} />
        <StatCard title="Total Revenue" value={`₹${(stats.revenue / 100000).toFixed(1)}L`} icon="📈" color="green" trend={12} />
        <StatCard title="Total Expense" value={`₹${(stats.expense / 100000).toFixed(1)}L`} icon="📉" color="yellow" trend={8} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold mb-4 text-gray-800">🤖 AI Classification Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">AI Classified</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-blue-600">{aiStats.aiClassified}</span>
                <span className="text-xs text-gray-500">/ {transactions.length}</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">High Confidence (&gt;80%)</span>
              <span className="text-lg font-bold text-green-600">{aiStats.highConfidence}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Avg Confidence</span>
              <span className="text-lg font-bold text-yellow-600">{(aiStats.avgConfidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Human Overridden</span>
              <span className="text-lg font-bold text-purple-600">{aiStats.overridden}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Unclassified</span>
              <span className="text-lg font-bold text-gray-600">{aiStats.unclassified}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold mb-4 text-gray-800">🔗 Reconciliation Status</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={reconcileData.length > 0 ? reconcileData : [{ name: 'No Data', value: 1, color: '#E5E7EB' }]}
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {(reconcileData.length > 0 ? reconcileData : [{ color: '#E5E7EB' }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">Matched</span>
                <span className="ml-auto font-bold text-green-600">{reconcileStats.matched}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600">Possible</span>
                <span className="ml-auto font-bold text-yellow-600">{reconcileStats.possible}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm text-gray-600">Unmatched</span>
                <span className="ml-auto font-bold text-purple-600">{reconcileStats.unmatched}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold mb-4 text-gray-800">12-Month Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={state.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* --- REGENERATED PIE CHART WITH LEGEND --- */}
        <Card>
          <h3 className="text-lg font-bold mb-4 text-gray-800">Category Breakdown</h3>
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-sm">No categories assigned yet</p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Recent Anomalies</h3>
          <div className="flex gap-2">
            <Badge variant="danger">{anomalyBreakdown.statistical.length} Statistical</Badge>
            <Badge variant="warning">{anomalyBreakdown.duplicate.length} Duplicates</Badge>
            <Badge variant="info">{anomalyBreakdown.logical.length} Logical</Badge>
          </div>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {state.anomalies.slice(0, 5).map((anomaly) => {
            const isStatistical = anomaly.anomaly_reason.includes('sigma')
            const isDuplicate = anomaly.anomaly_reason.includes('Duplicate')
            return (
              <div key={anomaly.id} className={`p-4 rounded-lg border ${isStatistical ? 'bg-red-50 border-red-200' : isDuplicate ? 'bg-yellow-50 border-yellow-200' : 'bg-indigo-50 border-indigo-200'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Badge variant={isStatistical ? 'danger' : isDuplicate ? 'warning' : 'info'}>
                      {isStatistical ? '📊 Statistical' : isDuplicate ? '📋 Duplicate' : '✓ Logical'}
                    </Badge>
                    <p className="font-semibold text-gray-800">{anomaly.description}</p>
                    <p className="text-sm text-gray-600 mt-1">{anomaly.anomaly_reason}</p>
                    <p className="text-xs text-gray-500 mt-2">{anomaly.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">₹{anomaly.amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}