import React, { useEffect, useState } from 'react'
import { Card, StatCard, Alert, Badge } from '../components'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'
import { AnomalyAlert, Transaction } from '../types'
import AnomalyCard from '../components/AnomalyCard'


// ─── Custom Glass Tooltip ─────────────────────────────────────
const GlassTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="liquid-glass rounded-xl p-3 text-xs shadow-2xl animate-fadeIn min-w-[140px]">
        <p className="font-bold mb-2 opacity-70 uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
              </div>
              <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                ₹{Number(entry.value).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

function ExpenseLeaderboard({ entityId }: { entityId: number }) {
  const [data, setData] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch(`/api/analytics/expense-breakdown?entity_id=${entityId}`)
      .then(r => r.json())
      .then(rows => {
        const top5 = [...rows]
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
        setData(top5);
      })
      .catch(() => setData([]));
  }, [entityId]);

  if (!data.length) return null;

  const max = data[0]?.amount || 1;

  return (
    <div className="lg:col-span-4 col-span-1">
      <Card className="liquid-glass border-none shadow-xl transition-all duration-300 hover:shadow-2xl overflow-hidden group">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black tracking-tight text-gray-800 dark:text-gray-100 flex items-center gap-2">
               📊 Top 5 expense categories
            </h3>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1 opacity-60">High-volume category analysis</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 animate-pulse">
            ↑
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {data.map((item, i) => {
            const barColors = [
              "from-red-500 to-rose-600",
              "from-orange-500 to-amber-600",
              "from-amber-400 to-yellow-500",
              "from-blue-500 to-indigo-600",
              "from-slate-400 to-slate-500"
            ];
            const shadowColors = [
              "shadow-red-500/30",
              "shadow-orange-500/30",
              "shadow-amber-500/30",
              "shadow-blue-500/30",
              "shadow-slate-500/20"
            ];
            
            return (
              <div key={item.category} className="space-y-3 relative group/item">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-black text-gray-800 dark:text-gray-100 truncate group-hover/item:text-blue-500 transition-colors">
                    {item.category}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ₹{item.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-[1px]">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${barColors[i] || "bg-gray-400"} shadow-lg ${shadowColors[i] || ""} transition-all duration-1000 ease-out`}
                    style={{ width: `${(item.amount / max) * 100}%` }}
                  />
                </div>
                
                <div className="absolute -inset-2 rounded-xl bg-blue-500/0 group-hover/item:bg-blue-500/[0.03] transition-all -z-10" />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

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
        <StatCard 
          title="Total Transactions" 
          rawValue={stats.total} 
          value={stats.total} 
          icon="💳" 
          color="blue" 
          loading={state.loading}
        />
        <StatCard 
          title="Anomalies Detected" 
          rawValue={stats.anomalies} 
          value={stats.anomalies} 
          icon="⚠️" 
          color="red" 
          trend={-15} 
          loading={state.loading}
        />
        <StatCard 
          title="Total Revenue" 
          rawValue={stats.revenue} 
          value={`₹${(stats.revenue / 100000).toFixed(1)}L`} 
          icon="📈" 
          color="green" 
          trend={12} 
          loading={state.loading}
        />
        <StatCard 
          title="Total Expense" 
          rawValue={stats.expense} 
          value={`₹${(stats.expense / 100000).toFixed(1)}L`} 
          icon="📉" 
          color="yellow" 
          trend={8} 
          loading={state.loading}
        />
        <ExpenseLeaderboard entityId={state.selectedEntityId || 1} />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">🤖 AI Classification Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Classified</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{aiStats.aiClassified}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">/ {transactions.length}</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/40 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">High Confidence (&gt;80%)</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">{aiStats.highConfidence}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-950/40 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Confidence</span>
              <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{(aiStats.avgConfidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-950/40 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Human Overridden</span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{aiStats.overridden}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unclassified</span>
              <span className="text-lg font-bold text-gray-600 dark:text-gray-300">{aiStats.unclassified}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">🔗 Reconciliation Status</h3>
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
                <span className="text-sm text-gray-600 dark:text-gray-400">Matched</span>
                <span className="ml-auto font-bold text-green-600 dark:text-green-400">{reconcileStats.matched}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Possible</span>
                <span className="ml-auto font-bold text-yellow-600 dark:text-yellow-400">{reconcileStats.possible}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Unmatched</span>
                <span className="ml-auto font-bold text-purple-600 dark:text-purple-400">{reconcileStats.unmatched}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">12-Month Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={state.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
              <Tooltip content={<GlassTooltip />} cursor={{ stroke: 'var(--accent)', strokeWidth: 2, opacity: 0.1 }} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* --- REGENERATED PIE CHART WITH LEGEND --- */}
        <Card>
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Category Breakdown</h3>
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
                <Tooltip content={<GlassTooltip />} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ paddingTop: '30px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-sm">No categories assigned yet</p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Recent Anomalies</h3>
          <div className="flex gap-2">
            <Badge variant="danger">{anomalyBreakdown.statistical.length} Statistical</Badge>
            <Badge variant="warning">{anomalyBreakdown.duplicate.length} Duplicates</Badge>
            <Badge variant="info">{anomalyBreakdown.logical.length} Logical</Badge>
          </div>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {state.anomalies.slice(0, 5).map((anomaly) => (
            <AnomalyCard key={anomaly.id} anomaly={anomaly} />
          ))}
        </div>
      </Card>
    </div>
  )
}