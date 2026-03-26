import React, { useEffect, useRef, useState, createContext, useContext, useCallback, ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

// ─── Context ──────────────────────────────────────────────────
const ToastContext = createContext<ToastContextType | null>(null)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

// ─── Individual Toast Item ────────────────────────────────────
const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

const toastStyles: Record<ToastType, { accent: string; icon: string; glow: string }> = {
  success: {
    accent: 'from-emerald-400 to-teal-500',
    icon: 'bg-emerald-500/20 text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  error: {
    accent: 'from-red-400 to-rose-500',
    icon: 'bg-red-500/20 text-red-400',
    glow: 'shadow-red-500/10',
  },
  warning: {
    accent: 'from-amber-400 to-orange-500',
    icon: 'bg-amber-500/20 text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  info: {
    accent: 'from-blue-400 to-indigo-500',
    icon: 'bg-blue-500/20 text-blue-400',
    glow: 'shadow-blue-500/10',
  },
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [progress, setProgress] = useState(100)
  const duration = toast.duration ?? 4000
  const s = toastStyles[toast.type]
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    // Enter animation
    requestAnimationFrame(() => setVisible(true))

    // Progress bar
    const step = 100 / (duration / 50)
    intervalRef.current = window.setInterval(() => {
      setProgress(p => {
        if (p <= 0) {
          clearInterval(intervalRef.current!)
          dismiss()
          return 0
        }
        return p - step
      })
    }, 50)

    return () => clearInterval(intervalRef.current!)
  }, [])

  const dismiss = useCallback(() => {
    setLeaving(true)
    setTimeout(() => onRemove(toast.id), 400)
  }, [toast.id, onRemove])

  return (
    <div
      onClick={dismiss}
      style={{
        transform: visible && !leaving
          ? 'translateX(0) scale(1)'
          : leaving
            ? 'translateX(120%) scale(0.9)'
            : 'translateX(120%) scale(0.95)',
        opacity: visible && !leaving ? 1 : 0,
        transition: leaving
          ? 'transform 0.4s cubic-bezier(0.4,0,1,1), opacity 0.35s ease'
          : 'transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease',
        marginBottom: '10px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div
        className={`relative overflow-hidden rounded-2xl shadow-2xl ${s.glow} backdrop-blur-2xl`}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
          border: '1px solid rgba(255,255,255,0.15)',
          minWidth: '300px',
          maxWidth: '380px',
        }}
      >
        {/* Frosted glass inner glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)',
          }}
        />

        {/* Accent top bar */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.accent} rounded-t-2xl`} />

        <div className="flex items-start gap-3 px-4 py-3.5 relative">
          {/* Icon */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${s.icon}`}>
            {icons[toast.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-white leading-snug">{toast.title}</p>
            {toast.message && (
              <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{toast.message}</p>
            )}
          </div>

          {/* Close */}
          <button className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition text-xs mt-0.5">
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 rounded-b-2xl overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${s.accent} rounded-full transition-none`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Toast Container ──────────────────────────────────────────
const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────
let idCounter = 0

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = `toast-${++idCounter}`
    setToasts(prev => [...prev, { ...options, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const ctx: ToastContextType = {
    toast: addToast,
    success: (title, message) => addToast({ type: 'success', title, message }),
    error: (title, message) => addToast({ type: 'error', title, message }),
    warning: (title, message) => addToast({ type: 'warning', title, message }),
    info: (title, message) => addToast({ type: 'info', title, message }),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}
