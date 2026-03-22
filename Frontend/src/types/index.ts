// Entity Types
export interface Entity {
  id: number
  name: string
  created_at: string
}

// Transaction Types
export interface Transaction {
  id: number
  entity_id: number
  date: string
  description: string
  amount: number
  transaction_type: 'debit' | 'credit'
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  category?: string
  ai_category?: string
  ai_confidence?: number
  ai_overridden?: boolean
  reconcile_status?: 'matched' | 'possible' | 'unmatched'
  is_anomaly?: boolean
  anomaly_reason?: string
  cash_flow_section?: 'operating' | 'investing' | 'financing'
  created_at?: string
  updated_at?: string
}

// Create Transaction DTO
export interface CreateTransactionDTO {
  entity_id: number
  date: string
  description: string
  amount: number
  transaction_type: 'debit' | 'credit'
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  cash_flow_section?: 'operating' | 'investing' | 'financing'
}

// Update Transaction DTO
export interface UpdateTransactionDTO {
  category?: string
  reconcile_status?: string
}

// Classification Types
export interface ClassificationResult {
  category: string
  confidence: number
}

export interface ClassifyFeedback {
  id?: number
  transaction_id: number
  original_category: string
  corrected_category: string
  created_at?: string
}

// Audit Block Types
export interface AuditBlock {
  id: number
  block_number: number
  transaction_id: number
  previous_hash: string
  block_hash: string
  is_tampered: boolean
  created_at: string
}

export interface AuditChainStatus {
  valid: boolean
  broken_at?: number
  total_blocks: number
}

// Bank Row Types
export interface BankRow {
  id: number
  entity_id: number
  date: string
  description: string
  amount: number
  status: 'matched' | 'possible' | 'unmatched'
  matched_tx_id?: number
  uploaded_at: string
}

// Analytics Types
export interface AnomalyAlert {
  id: number
  transaction_id: number
  description: string
  amount: number
  anomaly_reason: string
  date: string
  category?: string
  severity?: 'high' | 'medium' | 'low'
}

export interface MonthlyTrend {
  month: string
  revenue: number
  expense: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  count: number
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  status: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// Filter Types
export interface TransactionFilters {
  entity_id?: number
  start_date?: string
  end_date?: string
  category?: string
  account_type?: string
  reconcile_status?: string
  is_anomaly?: boolean
  min_amount?: number
  max_amount?: number
  page?: number
  limit?: number
}

// Dashboard Stats
export interface DashboardStats {
  total_transactions: number
  total_amount: number
  anomalies_count: number
  anomalies_percentage: number
  cash_position: number
  monthly_revenue: number
  monthly_expense: number
}
