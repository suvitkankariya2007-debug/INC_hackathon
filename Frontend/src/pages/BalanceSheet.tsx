import React, { useEffect, useState } from 'react'
import { Card, Alert, Button, Input } from '../components'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'

export const BalanceSheet: React.FC = () => {
    const { state, setError, setLoading } = useApp()
    const [data, setData] = useState<any>(null)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        loadData()
    }, [state.selectedEntityId, date])

    const loadData = async () => {
        try {
            setLoading(true)
            const res = await apiClient.getBalanceSheet(state.selectedEntityId || 1, date)
            setData(res)
            setError(null)
        } catch (err: any) {
            setError(err.message || 'Failed to load balance sheet')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Balance Sheet</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Snapshot of Assets, Liabilities, and Equity</p>
                </div>
                <div className="flex items-end gap-4">
                    <Input
                        type="date"
                        label="As of Date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <Button onClick={loadData} variant="secondary">Refresh</Button>
                </div>
            </div>

            {state.error && <Alert variant="danger" icon="✕">{state.error}</Alert>}

            {data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Assets */}
                    <div className="space-y-6">
                        <Card className="border-l-4 border-l-green-500">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Total Assets</h2>
                                <span className="text-2xl font-black text-green-600">₹{data.assets.toLocaleString()}</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                    <span className="font-medium dark:text-gray-200">Current Assets</span>
                                    <span className="font-bold dark:text-gray-100">₹{data.assets.toLocaleString()}</span>
                                </div>
                                {/* Simplified for demo, in real case we would breakdown more */}
                                <p className="text-xs text-gray-400 dark:text-gray-500 px-3">Includes Cash, Accounts Receivable, Inventory</p>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Liabilities + Equity */}
                    <div className="space-y-6">
                        <Card className="border-l-4 border-l-blue-500">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Liabilities & Equity</h2>
                                <span className="text-2xl font-black text-blue-600">₹{data.total_l_e.toLocaleString()}</span>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between p-3 bg-red-50 dark:bg-red-950/40 rounded">
                                        <span className="font-medium text-red-800 dark:text-red-300">Total Liabilities</span>
                                        <span className="font-bold text-red-800 dark:text-red-300">₹{data.liabilities.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 px-3 mt-1 uppercase">Accounts Payable, Loans, Tax Liabilities</p>
                                </div>

                                <div>
                                    <div className="flex justify-between p-3 bg-purple-50 dark:bg-purple-950/40 rounded">
                                        <span className="font-medium text-purple-800 dark:text-purple-300">Total Equity</span>
                                        <span className="font-bold text-purple-800 dark:text-purple-300">₹{data.equity.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 px-3 mt-1 uppercase">Capital Stock, Retained Earnings</p>
                                </div>
                            </div>
                        </Card>

                        <Card className={data.is_balanced ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"}>
                            <div className="flex justify-between items-center">
                                <span className="font-bold">{data.is_balanced ? "✓ System Balanced" : "⚠️ Out of Balance"}</span>
                                <span className="text-xs font-mono">Diff: ₹{Math.abs(data.assets - data.total_l_e).toFixed(2)}</span>
                            </div>
                            {!data.is_balanced && (
                                <p className="text-xs text-red-600 mt-2">
                                    This may be caused by transactions with unclassified or missing account types. Ensure all transactions have a valid account type (asset, liability, equity, income, or expense).
                                </p>
                            )}
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
