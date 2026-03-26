import React, { useEffect, useState } from 'react'
import { Card, Alert, Button } from '../components'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'
import { Entity } from '../types'

export const Entities: React.FC = () => {
  const { state, setEntities, setSelectedEntity, setLoading, setError, setSuccess } = useApp()
  const [newEntityName, setNewEntityName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadEntities()
  }, [])

  const loadEntities = async () => {
    try {
      setLoading(true)
      const entities = await apiClient.getEntities()
      setEntities(entities)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load entities')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEntity = async () => {
    if (!newEntityName.trim()) {
      setError('Please enter an entity name')
      return
    }
    try {
      setCreating(true)
      const entity = await apiClient.createEntity(newEntityName.trim())
      setEntities([...state.entities, entity])
      setNewEntityName('')
      setSuccess(`Entity "${entity.name}" created successfully!`)
      setTimeout(() => setSuccess(null), 3000)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to create entity')
    } finally {
      setCreating(false)
    }
  }

  const handleSelectEntity = (entity: Entity) => {
    setSelectedEntity(entity.id)
    setSuccess(`Switched to "${entity.name}"`)
    setTimeout(() => setSuccess(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Entities</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your companies and switch between them</p>
        </div>
        <Button onClick={loadEntities} variant="secondary">
          🔄 Refresh
        </Button>
      </div>

      {state.error && <Alert variant="danger" icon="✕">{state.error}</Alert>}
      {state.success && <Alert variant="success" icon="✓">{state.success}</Alert>}

      {/* Create New Entity */}
      <Card>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Create New Entity</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entity Name</label>
            <input
              type="text"
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateEntity()}
              placeholder="e.g., Acme Corp, Smith and Sons..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            onClick={handleCreateEntity}
            disabled={creating}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition disabled:opacity-50"
          >
            {creating ? 'Creating...' : '+ Create Entity'}
          </button>
        </div>
      </Card>

      {/* Entity List */}
      <Card>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">All Entities</h2>
        {state.loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading entities...</p>
        ) : state.entities.length === 0 ? (
          <Alert variant="info" icon="ℹ️">No entities found. Create one above.</Alert>
        ) : (
          <div className="space-y-3">
            {state.entities.map((entity: Entity) => (
              <div
                key={entity.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition cursor-pointer ${
                  state.selectedEntityId === entity.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
                onClick={() => handleSelectEntity(entity)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {entity.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{entity.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Entity ID: {entity.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {state.selectedEntityId === entity.id && (
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                      ACTIVE
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectEntity(entity)
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      state.selectedEntityId === entity.id
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-300'
                    }`}
                  >
                    {state.selectedEntityId === entity.id ? '✓ Selected' : 'Switch To'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card>
        <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">About Multi-Entity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">🏢 Data Isolation</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Each entity has completely separate transactions, statements, and audit trails.
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950/40 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">⚡ Instant Switch</h4>
            <p className="text-sm text-green-700 dark:text-green-400">
              Switching entities reloads all data across every page instantly.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}