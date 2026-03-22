import React, { useEffect, useState } from 'react'
import { Card, Button, Input, Select, Table, TransactionTypeBadge, StatusBadge, Amount, Alert } from '../components'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'
import { Transaction, CreateTransactionDTO } from '../types'

export const Transactions: React.FC = () => {
  const { state, setTransactions, addTransaction, setLoading, setError, setSuccess } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
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
      setTransactions(response.items)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
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
      })
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

    try {
      setLoading(true)
      const result = await apiClient.uploadTransactionsCSV(file, state.selectedEntityId || 1)
      setSuccess(`${result.uploaded} transactions uploaded successfully`)
      loadTransactions()
      setShowUpload(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to upload transactions')
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
        <div>
          <p className="font-medium">{value || '-'}</p>
          {row.ai_confidence && (
            <p className="text-xs text-gray-500">{(row.ai_confidence * 100).toFixed(0)}% AI</p>
          )}
        </div>
      ),
    },
    {
      key: 'reconcile_status' as const,
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
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
        <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
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
            className="block w-full text-sm text-gray-500"
          />
          <p className="text-xs text-gray-600 mt-2">
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
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            />
            <Input
              label="Description"
              placeholder="Transaction description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="md:col-span-2"
            />
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
        <Table<Transaction>
          columns={columns}
          data={state.transactions}
          isLoading={state.loading}
          rowKey="id"
        />
      </Card>
    </div>
  )
}
