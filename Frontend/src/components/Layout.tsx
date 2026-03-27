import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { PageTransition } from './PageTransition'
import ledgeraiLogo from '../assets/ledgerai-logo.png'

interface LayoutProps {
  children: React.ReactNode
}

// ─── Dark Mode Hook ──────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('ledgerai-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('ledgerai-theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, setDark] as const
}

// ─── Layout ─────────────────────────────────────────────────
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dark, setDark] = useDarkMode()
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#dashboard')

  useEffect(() => {
    const onHash = () => setCurrentHash(window.location.hash || '#dashboard')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        style={{ background: 'var(--sidebar-bg)' }}
        className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} flex-shrink-0 transition-all duration-300 shadow-2xl flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} px-4 py-5 border-b border-white/10`}>
          {sidebarOpen && (
            <div className="flex items-center gap-2.5 animate-fadeIn">
              <img src={ledgeraiLogo} alt="LedgerAI" className="h-10 w-auto object-contain" />
            </div>
          )}
          {!sidebarOpen && (
            <img src={ledgeraiLogo} alt="LedgerAI" className="h-8 w-8 object-cover rounded-lg" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              {sidebarOpen
                ? <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                : <path d="M9 19l7-7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              }
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              {sidebarOpen && <div className="nav-group-label">{group.label}</div>}
              {!sidebarOpen && <div className="h-3" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentHash === item.href
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      title={!sidebarOpen ? item.label : undefined}
                      className={`nav-item glass-button ripple-btn ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center' : ''}`}
                    >
                      <span className="text-base flex-shrink-0 w-5 text-center">{item.icon}</span>
                      {sidebarOpen && (
                        <span className={`font-medium text-sm transition-opacity ${isActive ? 'opacity-100 text-white' : 'opacity-70'}`}>
                          {item.label}
                        </span>
                      )}
                      {sidebarOpen && isActive && (
                        <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full opacity-70 animate-pulse" />
                      )}
                    </a>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: dark mode toggle */}
        <div className="px-4 pb-5 pt-3 border-t border-white/10">
          {sidebarOpen ? (
            <div className="flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <span>{dark ? '🌙' : '☀️'}</span>
                <span>{dark ? 'Dark' : 'Light'} mode</span>
              </div>
              <button onClick={() => setDark(!dark)} className="theme-toggle" aria-label="Toggle dark mode" />
            </div>
          ) : (
            <button
              onClick={() => setDark(!dark)}
              className="w-full flex justify-center py-1.5 text-white/60 hover:text-white transition rounded-lg hover:bg-white/10"
              title="Toggle dark mode"
            >
              {dark ? '☀️' : '🌙'}
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        <Header dark={dark} setDark={setDark} />
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <PageTransition pageKey={currentHash}>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  )
}

// ─── Header ─────────────────────────────────────────────────
interface HeaderProps {
  dark: boolean
  setDark: (v: boolean) => void
}

const Header: React.FC<HeaderProps> = ({ dark, setDark }) => {
  const { state } = useApp()
  const [hash, setHash] = useState(window.location.hash.slice(1) || 'dashboard')

  useEffect(() => {
    const onHash = () => setHash(window.location.hash.slice(1) || 'dashboard')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const titles: Record<string, { title: string; subtitle: string; icon: string }> = {
    'dashboard': { title: 'Dashboard', subtitle: 'Real-time financial overview', icon: '📊' },
    'transactions': { title: 'Transactions', subtitle: 'Browse, filter and manage entries', icon: '💳' },
    'anomalies': { title: 'Anomaly Detection', subtitle: 'AI-powered outlier detection', icon: '⚠️' },
    'classify': { title: 'AI Classification', subtitle: 'ML-powered transaction categorizer', icon: '🏷️' },
    'audit': { title: 'Audit Trail', subtitle: 'SHA-256 blockchain verification', icon: '🔒' },
    'balance-sheet': { title: 'Balance Sheet', subtitle: 'Assets, liabilities & equity', icon: '⚖️' },
    'profit-loss': { title: 'Profit & Loss', subtitle: 'Income vs. expenses report', icon: '📈' },
    'cashflow': { title: 'Cash Flow', subtitle: 'Operating, investing & financing', icon: '💰' },
    'reconcile': { title: 'Reconciliation', subtitle: 'Bank statement matching', icon: '🔄' },
    'entities': { title: 'Entities', subtitle: 'Manage business entities', icon: '🏢' },
  }

  const page = titles[hash] || titles['dashboard']

  return (
    <header
      className="flex-shrink-0 border-b px-6 lg:px-8 py-4 flex items-center justify-between backdrop-blur-sm"
      style={{
        background: 'var(--header-bg)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{page.icon}</span>
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{page.title}</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{page.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Toast messages */}
        {state.success && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 rounded-xl text-sm animate-slideInLeft flex items-center gap-2">
            <span>✓</span> {state.success}
          </div>
        )}
        {state.error && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 rounded-xl text-sm animate-slideInLeft flex items-center gap-2">
            <span>✕</span> {state.error}
          </div>
        )}

        {/* Entity selector */}
        {state.entities.length > 0 && (
          <div
            className="px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-2 border"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent-light)' }}
          >
            <span>🏢</span>
            <span>{state.entities.find(e => e.id === state.selectedEntityId)?.name || 'Entity'}</span>
          </div>
        )}

        {/* Dark mode toggle (header copy) */}
        <button
          onClick={() => setDark(!dark)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all border"
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
          S
        </div>
      </div>
    </header>
  )
}

// ─── Nav groups ───────────────────────────────────────────────
const navGroups = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '#dashboard', icon: '📊' },
      { id: 'transactions', label: 'Transactions', href: '#transactions', icon: '💳' },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { id: 'anomalies', label: 'Anomalies', href: '#anomalies', icon: '⚠️' },
      { id: 'classify', label: 'Classify', href: '#classify', icon: '🏷️' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { id: 'balance-sheet', label: 'Balance Sheet', href: '#balance-sheet', icon: '⚖️' },
      { id: 'profit-loss', label: 'Profit & Loss', href: '#profit-loss', icon: '📈' },
      { id: 'cashflow', label: 'Cash Flow', href: '#cashflow', icon: '💰' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'reconcile', label: 'Reconciliation', href: '#reconcile', icon: '🔄' },
      { id: 'audit', label: 'Audit', href: '#audit', icon: '🔒' },
      { id: 'entities', label: 'Entities', href: '#entities', icon: '🏢' },
    ],
  },
]

