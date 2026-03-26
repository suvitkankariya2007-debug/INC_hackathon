import React, { useState } from 'react'
import { Card, Input, Select, Button, Badge, Alert } from '../components'
import { useApp } from '../context/AppContext'
import { apiClient } from '../services/apiClient'
import { ClassificationResult } from '../types'

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

export const Classify: React.FC = () => {
  const { setSuccess, setError, setLoading, state } = useApp()
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [history, setHistory] = useState<Array<{ text: string; result: ClassificationResult }>>([])
  const [feedback, setFeedback] = useState<string>('')

  const handleClassify = async () => {
    if (!input.trim()) {
      setError('Please enter a description')
      return
    }

    try {
      setLoading(true)
      const classResult = await apiClient.classifyText(input)
      setResult(classResult)
      setHistory((prev) => [{ text: input, result: classResult }, ...prev])
      setFeedback('')
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Classification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!feedback.trim() || !result) {
      setError('Please select a corrected category')
      return
    }

    try {
      setLoading(true)
      await apiClient.submitClassifyFeedback(null, result.category, feedback)
      setSuccess(`Feedback recorded! This helps improve our model.`)
      setInput('')
      setResult(null)
      setFeedback('')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number): 'success' | 'warning' | 'danger' => {
    if (confidence > 0.8) return 'success'
    if (confidence > 0.6) return 'warning'
    return 'danger'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">AI Classification Playground</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Test our transaction categorization engine</p>
      </div>

      {state.error && <Alert variant="danger" icon="✕">{state.error}</Alert>}
      {state.success && <Alert variant="success" icon="✓">{state.success}</Alert>}

      {/* Main Classifier Card */}
      <Card>
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">Classify Transaction</h2>
        <div className="space-y-4">
          <Input
            label="Transaction Description"
            placeholder="e.g., AWS invoice payment, Office rent payment, Employee salary..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleClassify()}
          />
          <Button onClick={handleClassify} isLoading={state.loading} variant="primary" size="lg">
            🔍 Classify
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/40 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Classification Result</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Predicted Category</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Confidence Score</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all"
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                  <Badge variant={getConfidenceColor(result.confidence)}>
                    {(result.confidence * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Feedback Section */}
            <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Is this correct?</h4>
              {result.confidence < 0.7 && (
                <Alert variant="warning" icon="⚠️">
                  Low confidence - please verify this classification
                </Alert>
              )}
              <div className="mt-4 flex gap-3 items-end">
                <Select
                  label="If incorrect, select the right category"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  options={[
                    { value: '', label: '-- Select correct category --' },
                    ...VALID_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
                  ]}
                />
                <Button
                  onClick={handleSubmitFeedback}
                  isLoading={state.loading}
                  variant="success"
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* How it Works */}
      <Card>
        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">How Classification Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/40 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">🤖 Machine Learning</h4>
            <p className="text-sm text-green-700 dark:text-green-400">
              TF-IDF vectorizer + Logistic Regression trained on 80%+ accurate historical data
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-2">Used when: Always first</p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">🧠 GPT Fallback</h4>
            <p className="text-sm text-purple-700 dark:text-purple-400">
              OpenAI GPT-4o-mini provides human-like context understanding
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-500 mt-2">Used when: ML confidence &lt; 0.60</p>
          </div>
        </div>
      </Card>

      {/* Recent History */}
      {history.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Classification History</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.map((item, idx) => (
              <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-gray-100">{item.text}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="primary">{item.result.category}</Badge>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {(item.result.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Popular Categories */}
      <Card>
        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Common Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            'Salary',
            'Rent',
            'Utilities',
            'IT Expense',
            'Office Supplies',
            'Travel',
            'Meals',
            'Marketing',
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setInput(cat)}
              className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition font-medium text-gray-700 dark:text-gray-300"
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
