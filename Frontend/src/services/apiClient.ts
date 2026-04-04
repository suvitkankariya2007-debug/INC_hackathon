import axios, { AxiosInstance } from 'axios'
import {
  Transaction,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  ClassificationResult,
  AnomalyAlert,
  MonthlyTrend,
  AuditChainStatus,
  Entity,
  PaginatedResponse,
  TransactionFilters,
} from '../types'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // ============ ENTITIES ============
  async getEntities(): Promise<Entity[]> {
    const response = await this.client.get('/entities')
    return response.data
  }

  async getEntity(id: number): Promise<Entity> {
    const response = await this.client.get(`/entities/${id}`)
    return response.data
  }

  async createEntity(name: string): Promise<Entity> {
    const response = await this.client.post('/entities', { name })
    return response.data
  }

  // ============ TRANSACTIONS ============
  async getTransactions(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> {
    const response = await this.client.get('/transactions', { params: filters })
    return {
      items: Array.isArray(response.data) ? response.data : response.data.items || [],
      total: Array.isArray(response.data) ? response.data.length : response.data.total || 0,
      page: 1,
      limit: Array.isArray(response.data) ? response.data.length : 0,
      total_pages: 1
    }
  }

  async getTransaction(id: number): Promise<Transaction> {
    const response = await this.client.get(`/transactions/${id}`)
    return response.data
  }

  async createTransaction(data: CreateTransactionDTO): Promise<Transaction> {
    const response = await this.client.post('/transactions', data)
    return response.data
  }

  async updateTransaction(id: number, data: UpdateTransactionDTO): Promise<Transaction> {
    const response = await this.client.put(`/transactions/${id}`, data)
    return response.data
  }

  async deleteTransaction(id: number): Promise<void> {
    await this.client.delete(`/transactions/${id}`)
  }

  async uploadTransactionsCSV(file: File, entityId: number): Promise<{ inserted: number; failed: number; errors: any[] }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await this.client.post(`/transactions/upload-csv?entity_id=${entityId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  // ============ CLASSIFICATION ============
  async classifyText(description: string): Promise<ClassificationResult> {
    const response = await this.client.post('/classify', { description })
    return response.data
  }

  async submitClassifyFeedback(
    transactionId: number | null,
    originalCategory: string,
    correctedCategory: string
  ): Promise<{ id: number }> {
    const response = await this.client.post('/classify/feedback', {
      // If transactionId is null (Playground), send 0 to satisfy the backend
      transaction_id: transactionId !== null ? transactionId : 0,
      original_category: originalCategory,
      corrected_category: correctedCategory,
    })
    return response.data
  }

  // ============ ANOMALIES ============
  async getAnomalies(entityId?: number): Promise<AnomalyAlert[]> {
    const response = await this.client.get('/analytics/anomalies', {
      params: entityId ? { entity_id: entityId } : {},
    })
    return response.data
  }

  // ============ ANALYTICS ============
  async getMonthlyTrend(entityId?: number): Promise<MonthlyTrend[]> {
    const response = await this.client.get('/analytics/monthly-trend', {
      params: entityId ? { entity_id: entityId } : {},
    })
    return response.data
  }

  // ============ AUDIT ============
  async verifyAuditChain(): Promise<AuditChainStatus> {
    const response = await this.client.get('/audit/verify')
    return response.data
  }

  // ============ STATEMENTS ============
  async getBalanceSheet(entityId: number, date?: string): Promise<any> {
    const response = await this.client.get('/statements/balance-sheet', {
      params: { entity_id: entityId, date }
    })
    return response.data
  }

  async getProfitLoss(entityId: number, startDate?: string, endDate?: string): Promise<any> {
    const response = await this.client.get('/statements/profit-loss', {
      params: { entity_id: entityId, start_date: startDate, end_date: endDate }
    })
    return response.data
  }

  async getCashFlow(entityId: number, startDate?: string, endDate?: string): Promise<any> {
    const response = await this.client.get('/statements/cash-flow', {
      params: { entity_id: entityId, start_date: startDate, end_date: endDate }
    })
    return response.data
  }

  // ============ RECONCILIATION ============
  async uploadBankStatement(file: File, entityId: number): Promise<{ message: string; inserted: number }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('entity_id', entityId.toString())
    const response = await this.client.post('/reconcile/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  async getReconciliationReport(entityId: number): Promise<any> {
    const response = await this.client.get('/reconcile/report', {
      params: { entity_id: entityId }
    })
    return response.data
  }

  async confirmReconciliation(bankRowId: number, transactionId: number): Promise<any> {
    const response = await this.client.post(`/reconcile/confirm/${bankRowId}`, null, {
      params: { transaction_id: transactionId }
    })
    return response.data
  }

  // ============ HEALTH CHECK ============
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 })
      return response.data
    } catch {
      throw new Error('Backend not available')
    }
  }
}

export const apiClient = new ApiClient()
