import React, { useEffect, useState } from 'react'
import { Card, Input } from '../components'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'

export const ProfitLoss: React.FC = () => {
    const { state, setError, setLoading } = useApp()
    const [data, setData] = useState<any>(null)
    const [dates, setDates] = useState({
        start: '2024-09-01',
        end: '2025-02-28'
    })

    useEffect(() => {
        loadData()
    }, [state.selectedEntityId, dates])

    const loadData = async () => {
        try {
            setLoading(true)
            const res = await apiClient.getProfitLoss(state.selectedEntityId || 1, dates.start, dates.end)
            setData(res)
        } catch (err: any) {
            setError(err.message || 'Failed to load P&L')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Profit & Loss</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Income and Expenses performance</p>
                </div>
                <div className="flex items-end gap-4">
                    <Input
                        type="date"
                        label="Start Date"
                        value={dates.start}
                        onChange={(e) => setDates({ ...dates, start: e.target.value })}
                    />
                    <Input
                        type="date"
                        label="End Date"
                        value={dates.end}
                        onChange={(e) => setDates({ ...dates, end: e.target.value })}
                    />
                </div>
            </div>

            {data && (
                <div className="space-y-6">
                    <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-none shadow-xl">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-blue-100 text-sm font-bold uppercase tracking-wider">Net Profit</p>
                                <h2 className="text-4xl font-black mt-1">₹{data.net_profit.toLocaleString()}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-blue-100 text-sm">Profit Margin</p>
                                <p className="text-2xl font-bold">{data.income > 0 ? ((data.net_profit / data.income) * 100).toFixed(1) : 0}%</p>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Income</h3>
                            <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                                <span className="font-bold text-gray-700 dark:text-gray-200">Total Revenue</span>
                                <span className="text-xl font-bold text-green-600">₹{data.income.toLocaleString()}</span>
                            </div>
                            <div className="mt-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span>Operating Revenue</span>
                                    <span>₹{data.income.toLocaleString()}</span>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Expenses</h3>
                            <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                                <span className="font-bold text-gray-700 dark:text-gray-200">Total Operating Expenses</span>
                                <span className="text-xl font-bold text-red-600">₹{data.expenses.toLocaleString()}</span>
                            </div>
                            <div className="mt-4 space-y-3">
                                {Object.entries(data.expenses_by_category).map(([cat, amt]: any) => (
                                    <div key={cat} className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">{cat}</span>
                                        <span className="font-medium">₹{amt.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
