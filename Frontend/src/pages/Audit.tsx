import React, { useEffect, useState } from 'react'
import { Card, Button, Alert, Badge } from '../components'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'
import { AuditChainStatus } from '../types'

export const Audit: React.FC = () => {
  const { setLoading, setError, state } = useApp()
  const [chainStatus, setChainStatus] = useState<AuditChainStatus | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    verifyChain()
  }, [])

  const verifyChain = async () => {
    try {
      setChecking(true)
      const status = await apiClient.verifyAuditChain()
      setChainStatus(status)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to verify audit chain')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Audit & Compliance</h1>
        <Button onClick={verifyChain} disabled={checking} variant="primary">
          🔄 Verify Chain
        </Button>
      </div>

      {state.error && <Alert variant="danger" icon="✕">{state.error}</Alert>}

      {/* Chain Status */}
      {chainStatus && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Hash Chain Status</h2>
              <p className="text-gray-600">SHA-256 blockchain-based audit trail</p>
            </div>
            <div className="text-center">
              {chainStatus.valid ? (
                <div className="text-5xl mb-2">✓</div>
              ) : (
                <div className="text-5xl mb-2 text-red-600">✕</div>
              )}
              <Badge variant={chainStatus.valid ? 'success' : 'danger'}>
                {chainStatus.valid ? 'VALID' : 'BROKEN'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-600 mb-2">Total Blocks</p>
              <p className="text-3xl font-bold text-blue-600">{chainStatus.total_blocks}</p>
            </div>
            {!chainStatus.valid && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-gray-600 mb-2">⚠️ Broken At Block</p>
                <p className="text-3xl font-bold text-red-600">{chainStatus.broken_at}</p>
              </div>
            )}
          </div>

          {!chainStatus.valid && (
            <Alert variant="danger" icon="✕" className="mt-4">
              The hash chain has been compromised at block {chainStatus.broken_at}. This indicates potential
              tampering with transaction records.
            </Alert>
          )}

          {chainStatus.valid && (
            <Alert variant="success" icon="✓" className="mt-4">
              The hash chain is valid and intact. All {chainStatus.total_blocks} transaction blocks have been
              verified to be tamper-proof.
            </Alert>
          )}
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <h3 className="text-lg font-bold mb-6 text-gray-800">How Hash Chain Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2">1️⃣ Block Creation</h4>
            <p className="text-sm text-blue-800">Each transaction creates a SHA-256 hash block containing:</p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1">
              <li>• Block number</li>
              <li>• Transaction ID</li>
              <li>• Previous block hash</li>
              <li>• Timestamp</li>
            </ul>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <h4 className="font-bold text-green-900 mb-2">2️⃣ Chain Linking</h4>
            <p className="text-sm text-green-800">Each block references the previous block's hash:</p>
            <div className="text-xs text-green-700 mt-2 font-mono bg-white p-2 rounded">
              Block N → Hash(Block N-1)
            </div>
            <p className="text-xs text-green-700 mt-2">Genesis block starts with '0' hash</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <h4 className="font-bold text-purple-900 mb-2">3️⃣ Tamper Detection</h4>
            <p className="text-sm text-purple-800">Any alteration breaks the chain:</p>
            <ul className="text-xs text-purple-700 mt-2 space-y-1">
              <li>• Changing a transaction</li>
              <li>• Reordering transactions</li>
              <li>• Inserting false entries</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Compliance Info */}
      <Card>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Compliance & Security</h3>
        <div className="space-y-4">
          <div className="flex gap-4 p-4 bg-green-50 rounded-lg">
            <span className="text-2xl">✓</span>
            <div>
              <h4 className="font-semibold text-green-900">Immutable Audit Trail</h4>
              <p className="text-sm text-green-700">All transactions are recorded in an immutable hash chain, making it impossible to alter past records without detection.</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-blue-50 rounded-lg">
            <span className="text-2xl">🔒</span>
            <div>
              <h4 className="font-semibold text-blue-900">Cryptographic Protection</h4>
              <p className="text-sm text-blue-700">SHA-256 hashing ensures that even a single bit change in a transaction creates a completely different hash.</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-purple-50 rounded-lg">
            <span className="text-2xl">📋</span>
            <div>
              <h4 className="font-semibold text-purple-900">Regulatory Compliance</h4>
              <p className="text-sm text-purple-700">Provides tamper-proof evidence for accounting audits and regulatory requirements (SOX, GDPR, etc.)</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-orange-50 rounded-lg">
            <span className="text-2xl">📊</span>
            <div>
              <h4 className="font-semibold text-orange-900">Continuous Verification</h4>
              <p className="text-sm text-orange-700">Regularly verify the chain integrity to detect any unauthorized modifications early.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Verification Schedule */}
      <Card>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Recommended Actions</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
            <label className="flex-1">
              <p className="font-medium text-gray-800">Verify chain integrity daily</p>
              <p className="text-sm text-gray-600">Run verification checks at end of business day</p>
            </label>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
            <label className="flex-1">
              <p className="font-medium text-gray-800">Export audit reports monthly</p>
              <p className="text-sm text-gray-600">Generate and archive hash chain verification reports</p>
            </label>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <input type="checkbox" className="w-5 h-5 text-blue-600" />
            <label className="flex-1">
              <p className="font-medium text-gray-800">Set up alerts for chain breaks</p>
              <p className="text-sm text-gray-600">Receive notifications if tampering is detected</p>
            </label>
          </div>
        </div>
      </Card>
    </div>
  )
}
