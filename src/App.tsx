import React, { useState, useEffect } from 'react'
import { useGymStore } from './store/useGymStore'
import { Sidebar, NavTab } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { DashboardView } from './components/dashboard/DashboardView'
import { ClientList } from './components/clients/ClientList'
import { ProductList } from './components/inventory/ProductList'
import { PosTerminal } from './components/pos/PosTerminal'
import { SalesHistoryView } from './components/sales/SalesHistoryView'
import { LoginView } from './components/auth/LoginView'

export function App() {
  const { currentUser, fetchData } = useGymStore()
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard')
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Base blanca sobria por defecto para la demostración
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!currentUser) {
    return <LoginView />
  }

  return (
    <div className="flex h-screen w-full bg-zinc-50 text-zinc-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onNavigateToPOS={() => setCurrentTab('pos')}
          onNavigateToClients={() => setCurrentTab('clients')}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          <div className="mx-auto max-w-6xl">
            {currentTab === 'dashboard' && (
              <DashboardView
                onNavigateToPOS={() => setCurrentTab('pos')}
                onNavigateToInventory={() => setCurrentTab('inventory')}
                onNavigateToClients={() => setCurrentTab('clients')}
              />
            )}

            {currentTab === 'clients' && <ClientList />}

            {currentTab === 'inventory' && <ProductList />}

            {currentTab === 'pos' && <PosTerminal />}

            {currentTab === 'sales' && <SalesHistoryView />}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
