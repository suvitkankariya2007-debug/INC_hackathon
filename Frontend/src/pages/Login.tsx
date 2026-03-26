import React, { useState } from 'react'
import { Card, Input, Button, Alert } from '../components'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'

export const Login: React.FC = () => {
    const { state, setEntities, setSelectedEntity, setError, setSuccess } = useApp()
    const [newFirmName, setNewFirmName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleRegisterFirm = async () => {
        if (!newFirmName.trim()) {
            setError('Please enter a firm name')
            return
        }

        try {
            setLoading(true)
            const newEntity = await apiClient.createEntity(newFirmName)
            const entities = await apiClient.getEntities()
            setEntities(entities)
            setSelectedEntity(newEntity.id)
            setSuccess('Firm registered successfully!')
            setNewFirmName('')
            window.location.hash = 'dashboard'
        } catch (err: any) {
            if (err.response?.status === 422 && err.response?.data?.detail?.includes('UNIQUE')) {
                setError('A firm with this name already exists.')
            } else {
                setError(err.message || 'Failed to register firm')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = (entityId: number) => {
        setSelectedEntity(entityId)
        setSuccess('Logged in successfully!')
        window.location.hash = 'dashboard'
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">LedgerAI</h1>
                    <p className="text-gray-600 dark:text-gray-400">Smart Accounting & Audit Platform</p>
                </div>

                {state.error && <Alert variant="danger" className="mb-4">{state.error}</Alert>}
                {state.success && <Alert variant="success" className="mb-4">{state.success}</Alert>}

                <Card>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Login to Existing Firm</h2>

                    {state.entities.length === 0 ? (
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 mb-6">
                            No firms registered yet. Create one below.
                        </div>
                    ) : (
                        <div className="space-y-3 mb-6">
                            {state.entities.map(entity => (
                                <button
                                    key={entity.id}
                                    onClick={() => handleLogin(entity.id)}
                                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all flex justify-between items-center bg-white dark:bg-gray-800"
                                >
                                    <span className="font-medium text-gray-800 dark:text-gray-100">{entity.name}</span>
                                    <span className="text-blue-600 dark:text-blue-400 text-sm">Login →</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or register new firm</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Firm Name"
                            placeholder="e.g. Acme Corp"
                            value={newFirmName}
                            onChange={(e) => setNewFirmName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleRegisterFirm()}
                        />
                        <Button
                            onClick={handleRegisterFirm}
                            isLoading={loading}
                            variant="primary"
                            className="w-full"
                        >
                            Register Firm
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
