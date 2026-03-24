import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'
          } bg-gray-900 text-white transition-all duration-300 shadow-lg overflow-y-auto`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-800">
          {sidebarOpen && <h1 className="text-2xl font-bold">LedgerAI</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition
                ${(window.location.hash || '#dashboard') === item.href ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'hover:bg-gray-800'}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        <Header />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}


const Header: React.FC = () => {
  const { state } = useApp()
  const currentHash = window.location.hash.slice(1) || 'dashboard'

  const titles: Record<string, string> = {
  'dashboard': 'Dashboard',
  'transactions': 'Transactions',
  'anomalies': 'Anomaly Detection',
  'classify': 'AI Classification',
  'audit': 'Audit Trail',
  'balance-sheet': 'Balance Sheet',
  'profit-loss': 'Profit & Loss',
  'cashflow': 'Cash Flow Statement',
  'reconcile': 'Reconciliation',
  'entities': 'Entities',
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-8 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{titles[currentHash] || 'LedgerAI'}</h2>
          <p className="text-sm text-gray-600">Secure Financial Management</p>
        </div>
        <div className="flex items-center gap-4">
          {state.success && (
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm transition-all animate-fadeIn">
              ✓ {state.success}
            </div>
          )}
          {state.error && (
            <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm transition-all animate-fadeIn">
              ✕ {state.error}
            </div>
          )}
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            S
          </div>
        </div>
      </div>
    </header>
  )
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', href: '#dashboard', icon: '📊' },
  { id: 'transactions', label: 'Transactions', href: '#transactions', icon: '💳' },
  { id: 'anomalies', label: 'Anomalies', href: '#anomalies', icon: '⚠️' },
  { id: 'classify', label: 'Classify', href: '#classify', icon: '🏷️' },
  { id: 'balance-sheet', label: 'Balance Sheet', href: '#balance-sheet', icon: '⚖️' },
  { id: 'profit-loss', label: 'Profit & Loss', href: '#profit-loss', icon: '📈' },
  { id: 'cashflow', label: 'Cash Flow', href: '#cashflow', icon: '💰' },
  { id: 'reconcile', label: 'Reconciliation', href: '#reconcile', icon: '🔄' },
  { id: 'audit', label: 'Audit', href: '#audit', icon: '🔒' },
  { id: 'entities', label: 'Entities', href: '#entities', icon: '🏢' },
]


