import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Transaction } from '@/db/db'

interface MonthItem {
  month: number
  year: number
  label: string
}

interface Props {
  transactions: Transaction[]
  months: MonthItem[]
}

type ViewMode = 'total' | 'monthly'

export function IncomeExpenseSection({ transactions, months }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('total')

  const monthlyData = useMemo(() => {
    return months.map((m) => {
      const monthTx = transactions.filter((t) => {
        const d = dayjs(t.date)
        return d.month() + 1 === m.month && d.year() === m.year
      })
      return {
        name: m.label,
        income: monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [transactions, months])

  const totalData = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return [{ name: 'Итого', income, expense }]
  }, [transactions])

  const chartData = viewMode === 'total' ? totalData : monthlyData

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="text-sm font-medium text-gray-500">Доходы / Расходы</div>
        <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('total')}
            className={`px-2 py-1 rounded-md transition-colors ${viewMode === 'total' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'}`}
          >
            Всего
          </button>
          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            className={`px-2 py-1 rounded-md transition-colors ${viewMode === 'monthly' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'}`}
          >
            По месяцам
          </button>
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="income" fill="#4CAF50" radius={[4, 4, 0, 0]} name="Доходы" />
            <Bar dataKey="expense" fill="#F44336" radius={[4, 4, 0, 0]} name="Расходы" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}