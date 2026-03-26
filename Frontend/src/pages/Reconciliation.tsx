import React, { useEffect, useState } from 'react'
import { Card, Button, Badge } from '../components'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'

export const Reconciliation: React.FC = () => {
    const { state, setError, setLoading, setSuccess } = useApp()
    const [report, setReport] = useState<any>(null)
    const [showUpload, setShowUpload] = useState(false)

    useEffect(() => {
        loadReport()
    }, [state.selectedEntityId])

    const loadReport = async () => {
        try {
            setLoading(true)
            const res = await apiClient.getReconciliationReport(state.selectedEntityId || 1)
            setReport(res)
        } catch (err: any) {
            setError(err.message || 'Failed to load reconciliation report')
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            setLoading(true)
            await apiClient.uploadBankStatement(file, state.selectedEntityId || 1)
            setSuccess('Bank statement uploaded successfully')
            loadReport()
            setShowUpload(false)
        } catch (err: any) {
            setError(err.message || 'Upload failed')
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async (brId: number, txId: number) => {
        try {
            await apiClient.confirmReconciliation(brId, txId)
            setSuccess('Transaction reconciled!')
            await loadReport()
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Reconciliation</h1>
                    <p className="text-gray-500 mt-1">Match bank statement rows with ledger transactions</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setShowUpload(!showUpload)} variant={showUpload ? "secondary" : "primary"}>
                        {showUpload ? "Cancel" : "Upload Bank Statement"}
                    </Button>
                    <Button onClick={loadReport} variant="secondary">Refresh</Button>
                </div>
            </div>

            {showUpload && (
                <Card className="bg-blue-50 border-blue-200">
                    <div className="flex flex-col items-center py-6">
                        <p className="mb-4 font-bold text-blue-800">Choose bank statement CSV (Format: date, description, amount)</p>
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
                    </div>
                </Card>
            )}

            {!report && (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <p className="text-6xl mb-4">🏦</p>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Bank Statement Uploaded</h3>
                    <p className="text-sm text-center max-w-sm">
                        Upload a bank statement CSV to start reconciling your transactions. The file should contain date, description, and amount columns.
                    </p>
                    <button
                        onClick={() => setShowUpload(true)}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                        Upload Bank Statement
                    </button>
                </div>
            )}

            {report && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column 1: Matched */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <h3 className="font-bold text-gray-700 uppercase tracking-tight">Auto-Matched ({report.matched.length})</h3>
                        </div>
                        {report.matched.map((item: any) => (
                            <Card key={item.id} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                                    <span>{item.date}</span>
                                    <Badge variant="success">90%+ Match</Badge>
                                </div>
                                <p className="font-medium line-clamp-1">{item.description}</p>
                                <p className="text-lg font-black mt-2">₹{item.amount.toLocaleString()}</p>
                                {item.match && (
                                    <div className="mt-3 pt-3 border-t text-[10px] text-gray-500">
                                        Matched with Ledger #{item.match.id}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>

                    {/* Column 2: Possible */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <h3 className="font-bold text-gray-700 uppercase tracking-tight">Possible Matches ({report.possible.length})</h3>
                        </div>
                        {report.possible.map((item: any) => (
                            <Card key={item.id} className="border-l-4 border-l-yellow-500 bg-yellow-50/30">
                                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                                    <span>{item.date}</span>
                                    <Badge variant="warning">Manual Review</Badge>
                                </div>
                                <p className="font-medium line-clamp-1">{item.description}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-lg font-black font-mono">₹{item.amount.toLocaleString()}</p>
                                    <Button size="sm" onClick={() => handleConfirm(item.id, item.match.id)}>Confirm</Button>
                                </div>
                                {item.match && (
                                    <div className="mt-3 pt-3 border-t text-[10px] text-gray-500">
                                        Suggested: "{item.match.description.slice(0, 30)}..."
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>

                    {/* Column 3: Unmatched */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <h3 className="font-bold text-gray-700 uppercase tracking-tight">Unmatched ({report.unmatched.length})</h3>
                        </div>
                        {report.unmatched.map((item: any) => (
                            <Card key={item.id} className="border-l-4 border-l-red-500 opacity-80">
                                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                                    <span>{item.date}</span>
                                    <Badge variant="danger">Not Found</Badge>
                                </div>
                                <p className="font-medium line-clamp-1">{item.description}</p>
                                <p className="text-lg font-black mt-2">₹{item.amount.toLocaleString()}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
