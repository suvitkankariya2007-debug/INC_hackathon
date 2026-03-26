import React, { useEffect, useState } from 'react'
import { Card, Button, Input, Select, Table, TransactionTypeBadge, StatusBadge, Amount, Alert, Badge } from '../components'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'
import { Transaction, CreateTransactionDTO } from '../types'

const VALID_CATEGORIES = [
  'Salary',
  'Rent',
  'Utilities',
  'IT Expense',
  'Office Supplies',
  'Travel',
  'Meals',
  'Marketing',
  'Professional Services',
  'Insurance',
  'Taxes',
  'Equipment',
  'Subscriptions',
  'Maintenance',
  'Miscellaneous',
]

export const Transactions: React.FC = () => {
  const { state, setTransactions, addTransaction, setLoading, setError, setSuccess } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [isClassifying, setIsClassifying] = useState(false)
  const [aiConfidence, setAiConfidence] = useState<number | null>(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    status: '',
  })
  const [formData, setFormData] = useState<CreateTransactionDTO>({
    entity_id: state.selectedEntityId || 1,
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    transaction_type: 'debit',
    account_type: 'expense',
    category: '',
  })

  useEffect(() => {
    loadTransactions()
  }, [state.selectedEntityId, filters])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getTransactions({
        entity_id: state.selectedEntityId || 1,
        start_date: filters.startDate,
        end_date: filters.endDate,
        category: filters.category,
        reconcile_status: filters.status,
        limit: 500,
      })
      const sortedTransactions = response.items.sort((a: Transaction, b: Transaction) => {
        const dateB = new Date(b.date).getTime() || 0;
        const dateA = new Date(a.date).getTime() || 0;
        return dateB - dateA;
      });
      setTransactions(sortedTransactions)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoClassify = async () => {
    if (!formData.description.trim()) return

    try {
      setIsClassifying(true)
      const result = await apiClient.classifyText(formData.description)
      setFormData(prev => ({ ...prev, category: result.category }))
      setAiConfidence(result.confidence)
    } catch (err) {
      console.error('Auto-classification failed', err)
    } finally {
      setIsClassifying(false)
    }
  }

  const handleCreateTransaction = async () => {
    try {
      setLoading(true)
      const newTx = await apiClient.createTransaction(formData)
      addTransaction(newTx)
      setSuccess('Transaction created successfully')
      setFormData({
        entity_id: state.selectedEntityId || 1,
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        transaction_type: 'debit',
        account_type: 'expense',
        category: '',
      })
      setAiConfidence(null)
      setShowForm(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be re-uploaded if needed
    e.target.value = ''

    try {
      setLoading(true)
      const result = await apiClient.uploadTransactionsCSV(file, state.selectedEntityId || 1)

      if (result.failed > 0) {
        setError(`${result.failed} rows failed. First error: ${result.errors[0]?.reason || 'Unknown'}`)
      } else {
        setSuccess(`${result.inserted} transactions uploaded successfully`)
        setTimeout(() => setSuccess(null), 3000)
      }

      setShowUpload(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload transactions')
    } finally {
      setLoading(false)           // setLoading(false) BEFORE loadTransactions
      await loadTransactions()    // awaited AFTER loading is cleared
    }
  }

  const handleCategoryChange = async (txId: number, newCategory: string, originalCategory: string) => {
    try {
      setLoading(true)
      await apiClient.updateTransaction(txId, { category: newCategory })

      // Submit feedback to AI system
      await apiClient.submitClassifyFeedback(txId, originalCategory, newCategory)

      // Update local state
      const updatedTransactions = state.transactions.map(t =>
        t.id === txId ? { ...t, category: newCategory, ai_overridden: true } : t
      )
      setTransactions(updatedTransactions)

      setSuccess('Category updated and AI feedback recorded')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update category')
    } finally {
      setLoading(false)
    }
  }

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
      render: (value: number) => <Amount value={value} />,
    },
    {
      key: 'transaction_type' as const,
      label: 'Type',
      render: (value: string) => <TransactionTypeBadge type={value} />,
    },
    {
      key: 'category' as const,
      label: 'Category',
      render: (value: string, row: Transaction) => (
        <div className="flex flex-col gap-1 min-w-[150px]">
          <select
            value={value || ''}
            onChange={(e) => handleCategoryChange(row.id, e.target.value, row.ai_category || value || 'Uncategorized')}
            className="bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded p-1 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-gray-800 dark:text-gray-200"
          >
            <option value="">Uncategorized</option>
            {VALID_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {row.ai_confidence && !Boolean(row.ai_overridden) && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold px-1">
              {(row.ai_confidence * 100).toFixed(0)}% AI Suggestion
            </p>
          )}
          {!!row.ai_overridden && (
            <p className="text-[10px] text-blue-500 uppercase tracking-wider font-bold px-1">
              ✓ User Verified
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'reconcile_status' as const,
      label: 'Status',
      render: (value: string) => <StatusBadge status={value || 'unmatched'} />,
    },
    {
      key: 'is_anomaly' as const,
      label: 'Anomaly',
      render: (value: boolean) => (value ? '⚠️ Yes' : '✓ No'),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Transactions</h1>
        <div className="flex gap-3">
          <Button onClick={() => setShowUpload(!showUpload)} variant="secondary">
            📤 Upload CSV
          </Button>
          <Button onClick={() => setShowForm(!showForm)} variant="primary">
            ➕ New Transaction
          </Button>
        </div>
      </div>

      {state.error && <Alert variant="danger" icon="✕">{state.error}</Alert>}
      {state.success && <Alert variant="success" icon="✓">{state.success}</Alert>}

      {/* Upload Form */}
      {showUpload && (
        <Card>
          <h3 className="text-lg font-bold mb-4">Upload Transactions (CSV)</h3>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={state.loading}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:text-gray-600 dark:file:text-gray-300"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            CSV should have columns: date, description, amount, transaction_type, account_type
          </p>
        </Card>
      )}

      {/* Create Form */}
      {showForm && (
        <Card>
          <h3 className="text-lg font-bold mb-4">Create New Transaction</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            <Input
              type="number"
              label="Amount"
              placeholder="0.00"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Description"
              placeholder="Transaction description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              onBlur={handleAutoClassify}
            />
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  label="Category (Auto-classified)"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={isClassifying}
                  options={[
                    { value: '', label: 'Uncategorized' },
                    ...VALID_CATEGORIES.map(cat => ({ value: cat, label: cat }))
                  ]}
                />
              </div>
              {aiConfidence !== null && (
                <div className="mb-2">
                  <Badge variant={aiConfidence > 0.8 ? 'success' : aiConfidence > 0.5 ? 'warning' : 'danger'}>
                    {(aiConfidence * 100).toFixed(0)}% AI
                  </Badge>
                </div>
              )}
            </div>
            <Select
              label="Type"
              value={formData.transaction_type}
              onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as 'debit' | 'credit' })}
              options={[
                { value: 'debit', label: 'Debit' },
                { value: 'credit', label: 'Credit' },
              ]}
            />
            <Select
              label="Account Type"
              value={formData.account_type}
              onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
              options={[
                { value: 'asset', label: 'Asset' },
                { value: 'liability', label: 'Liability' },
                { value: 'equity', label: 'Equity' },
                { value: 'income', label: 'Income' },
                { value: 'expense', label: 'Expense' },
              ]}
            />
            <Select
              label="Cash Flow Section (Optional)"
              value={formData.cash_flow_section || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cash_flow_section: (e.target.value as any) || undefined,
                })
              }
              options={[
                { value: 'operating', label: 'Operating' },
                { value: 'investing', label: 'Investing' },
                { value: 'financing', label: 'Financing' },
              ]}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleCreateTransaction}
              isLoading={state.loading}
              variant="primary"
            >
              Create Transaction
            </Button>
            <Button onClick={() => setShowForm(false)} variant="secondary">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="date"
            label="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <Input
            type="date"
            label="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
          <Input
            label="Category"
            placeholder="Filter by category"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: '', label: 'All' },
              { value: 'matched', label: 'Matched' },
              { value: 'possible', label: 'Possible' },
              { value: 'unmatched', label: 'Unmatched' },
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          data={state.transactions}
          isLoading={state.loading}
          rowKey="id"
        />
      </Card>
    </div>
  )
}
