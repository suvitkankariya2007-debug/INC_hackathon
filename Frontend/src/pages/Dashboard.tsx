import React, { useEffect, useState } from 'react'
import { Card, StatCard, Alert } from '../components'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'
import { MonthlyTrend, AnomalyAlert, Transaction } from '../types'

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

      // Load transactions
      const txRes = await apiClient.getTransactions({
        entity_id: entityId,
        limit: 100,
      })
      setTransactions(txRes.items)

      // Load anomalies
      const anomalies = await apiClient.getAnomalies(entityId)
      setAnomalies(anomalies)

      // Load monthly trends
      const trends = await apiClient.getMonthlyTrend(entityId)
      setMonthlyTrends(trends)

      // Calculate stats
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

  const categoryBreakdown = transactions
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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

  return (
    <div className="space-y-8">
      {/* Alerts */}
      {state.error && (
        <Alert variant="danger" icon="✕">
          {state.error}
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Transactions"
          value={stats.total}
          icon="💳"
          color="blue"
        />
        <StatCard
          title="Anomalies Detected"
          value={stats.anomalies}
          icon="⚠️"
          color="red"
          trend={-15}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(stats.revenue / 100000).toFixed(1)}L`}
          icon="📈"
          color="green"
          trend={12}
        />
        <StatCard
          title="Total Expense"
          value={`₹${(stats.expense / 100000).toFixed(1)}L`}
          icon="📉"
          color="yellow"
          trend={8}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expense Trend */}
        <Card>
          <h3 className="text-lg font-bold mb-4 text-gray-800">12-Month Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={state.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <h3 className="text-lg font-bold mb-4 text-gray-800">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name }) => name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Anomalies */}
      <Card>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Recent Anomalies</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {state.anomalies.slice(0, 5).map((anomaly) => (
            <div
              key={anomaly.id}
              className="p-4 bg-red-50 border border-red-200 rounded-lg hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{anomaly.description}</p>
                  <p className="text-sm text-gray-600 mt-1">{anomaly.anomaly_reason}</p>
                  <p className="text-xs text-gray-500 mt-2">{anomaly.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">₹{anomaly.amount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
          {state.anomalies.length === 0 && (
            <p className="text-center text-gray-500 py-8">✓ No anomalies detected</p>
          )}
        </div>
      </Card>
    </div>
  )
}
