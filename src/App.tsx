import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { seedDefaults } from '@/db/seed'
import Dashboard from '@/pages/Dashboard'
import AddExpense from '@/pages/AddExpense'
import Balance from '@/pages/Balance'
import Transactions from '@/pages/Transactions'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'

const queryClient = new QueryClient()

export default function App() {
  useEffect(() => { seedDefaults() }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddExpense />} />
            <Route path="/balance" element={<Balance />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppShell>
      </HashRouter>
    </QueryClientProvider>
  )
}