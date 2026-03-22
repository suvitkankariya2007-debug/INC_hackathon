import React, { useEffect, useState } from 'react'
import { Layout } from './components'
import { Dashboard, Transactions, Anomalies, Classify, Audit } from './pages'
import { useApp } from './context/AppContext'
import { apiClient } from './services/apiClient'

function App() {
  const { setEntities, setSelectedEntity, setError } = useApp()
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'transactions' | 'anomalies' | 'classify' | 'audit'>('dashboard')

  useEffect(() => {
    initializeApp()
    // Handle routing
    window.addEventListener('hashchange', handleNavigation)
    return () => window.removeEventListener('hashchange', handleNavigation)
  }, [])

  const initializeApp = async () => {
    try {
      // Health check
      await apiClient.healthCheck()

      // Load entities
      const entities = await apiClient.getEntities()
      setEntities(entities)

      if (entities.length > 0) {
        setSelectedEntity(entities[0].id)
      }
    } catch (err) {
      setError('Failed to connect to backend. Make sure the server is running on http://localhost:8000')
      console.error(err)
    }
  }

  const handleNavigation = () => {
    const hash = window.location.hash.slice(1) || 'dashboard'
    const validPages = ['dashboard', 'transactions', 'anomalies', 'classify', 'audit']
    if (validPages.includes(hash)) {
      setCurrentPage(hash as any)
    }
  }

  // Update URL when page changes
  useEffect(() => {
    window.location.hash = currentPage
  }, [currentPage])

  // Override the layout navigation
  const originalLayout = Layout
  const LayoutWithNavigation = (props: any) => {
    const OriginalLayout = originalLayout
    return (
      <OriginalLayout {...props}>
        {/* Update nav items click handlers */}
        {props.children}
      </OriginalLayout>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'transactions':
        return <Transactions />
      case 'anomalies':
        return <Anomalies />
      case 'classify':
        return <Classify />
      case 'audit':
        return <Audit />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout>
      {renderPage()}
      <style>{`
        a {
          cursor: pointer;
          text-decoration: none;
        }
      `}</style>
    </Layout>
  )
}

// Create a simple router navigation
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  const link = target.closest('a') as HTMLAnchorElement
  if (link) {
    const href = link.getAttribute('href')
    if (href && href.startsWith('/')) {
      e.preventDefault()
      window.location.hash = href.slice(1)
    }
  }
})

export default App
