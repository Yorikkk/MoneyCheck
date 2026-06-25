import { useEffect, useRef, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { seedDefaults } from '@/db/seed'
import { db } from '@/db/db'
import Dashboard from '@/pages/Dashboard'
import AddExpense from '@/pages/AddExpense'
import Balance from '@/pages/Balance'
import Transactions from '@/pages/Transactions'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'

const queryClient = new QueryClient()

export default function App() {
  const [ready, setReady] = useState(false)
  const seeded = useRef(false)

  useEffect(() => {
    if (seeded.current) return
    seeded.current = true

    ;(async () => {
      await db.open()
      await seedDefaults()
      setReady(true)
    })()
  }, [])

  if (!ready) {
    return (
      <div className="h-dvh flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Загрузка...</span>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppShell className="relative">
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