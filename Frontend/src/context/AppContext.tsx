import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react'
import { Entity, Transaction, AnomalyAlert, MonthlyTrend } from '../types'

interface AppState {
  entities: Entity[]
  selectedEntityId: number | null
  transactions: Transaction[]
  anomalies: AnomalyAlert[]
  monthlyTrends: MonthlyTrend[]
  loading: boolean
  error: string | null
  success: string | null
}

type AppAction =
  | { type: 'SET_ENTITIES'; payload: Entity[] }
  | { type: 'SET_SELECTED_ENTITY'; payload: number }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: number }
  | { type: 'SET_ANOMALIES'; payload: AnomalyAlert[] }
  | { type: 'SET_MONTHLY_TRENDS'; payload: MonthlyTrend[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' }

const initialState: AppState = {
  entities: [],
  selectedEntityId: null,
  transactions: [],
  anomalies: [],
  monthlyTrends: [],
  loading: false,
  error: null,
  success: null,
}

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_ENTITIES':
      return { ...state, entities: action.payload }
    case 'SET_SELECTED_ENTITY':
      return { ...state, selectedEntityId: action.payload }
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload }
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] }
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.payload.id ? action.payload : t)),
      }
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.payload) }
    case 'SET_ANOMALIES':
      return { ...state, anomalies: action.payload }
    case 'SET_MONTHLY_TRENDS':
      return { ...state, monthlyTrends: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_SUCCESS':
      return { ...state, success: action.payload }
    case 'CLEAR_MESSAGES':
      return { ...state, error: null, success: null }
    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  setEntities: (entities: Entity[]) => void
  setSelectedEntity: (id: number) => void
  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (transaction: Transaction) => void
  deleteTransaction: (id: number) => void
  setAnomalies: (anomalies: AnomalyAlert[]) => void
  setMonthlyTrends: (trends: MonthlyTrend[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
  clearMessages: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const setEntities = useCallback((entities: Entity[]) => {
    dispatch({ type: 'SET_ENTITIES', payload: entities })
  }, [])

  const setSelectedEntity = useCallback((id: number) => {
    dispatch({ type: 'SET_SELECTED_ENTITY', payload: id })
  }, [])

  const setTransactions = useCallback((transactions: Transaction[]) => {
    dispatch({ type: 'SET_TRANSACTIONS', payload: transactions })
  }, [])

  const addTransaction = useCallback((transaction: Transaction) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction })
  }, [])

  const updateTransaction = useCallback((transaction: Transaction) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction })
  }, [])

  const deleteTransaction = useCallback((id: number) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id })
  }, [])

  const setAnomalies = useCallback((anomalies: AnomalyAlert[]) => {
    dispatch({ type: 'SET_ANOMALIES', payload: anomalies })
  }, [])

  const setMonthlyTrends = useCallback((trends: MonthlyTrend[]) => {
    dispatch({ type: 'SET_MONTHLY_TRENDS', payload: trends })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const setSuccess = useCallback((success: string | null) => {
    dispatch({ type: 'SET_SUCCESS', payload: success })
  }, [])

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' })
  }, [])

  const value: AppContextType = {
    state,
    setEntities,
    setSelectedEntity,
    setTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setAnomalies,
    setMonthlyTrends,
    setLoading,
    setError,
    setSuccess,
    clearMessages,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = (): AppContextType => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
