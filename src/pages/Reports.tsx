import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { useAllTransactions, useCategories, useAccounts } from '@/hooks/useDb'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { ExpenseStructureSection } from '@/components/reports/ExpenseStructureSection'

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

const PERIOD_LABELS: Record<number, string> = {
  1: 'месяц',
  3: '3 месяца',
  6: '6 месяцев',
  12: 'год',
}

export default function Reports() {
  const now = dayjs()
  const [period, setPeriod] = useState(1)
  const allTx = useAllTransactions() ?? []
  const categories = useCategories() ?? []
  const accounts = useAccounts() ?? []

  const months = useMemo(() => {
    const result: { month: number; year: number; label: string }[] = []
    for (let i = period - 1; i >= 0; i--) {
      const d = now.subtract(i, 'month')
      result.push({
        month: d.month() + 1,
        year: d.year(),
        label: `${MONTHS[d.month()]} ${String(d.year()).slice(2)}`,
      })
    }
    return result
  }, [period])

  const incomeByMonth = useMemo(() => {
    return months.map((m) => {
      const monthTx = allTx.filter((t) => {
        const d = dayjs(t.date)
        return d.month() + 1 === m.month && d.year() === m.year
      })
      return {
        name: m.label,
        income: monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [allTx, months])

  const periodTx = useMemo(() => {
    return allTx.filter((t) => {
      const d = dayjs(t.date)
      return months.some((m) => d.month() + 1 === m.month && d.year() === m.year)
    })
  }, [allTx, months])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Отчёты</h1>

      <div className="flex gap-2">
        {([1, 3, 6, 12] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 text-sm rounded-lg ${period === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 shadow-sm'}`}
          >
            {p === 1 ? 'Месяц' : p === 3 ? '3 мес' : p === 6 ? '6 мес' : 'Год'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="text-sm font-medium text-gray-500 mb-3">Доходы / Расходы</div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeByMonth}>
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

      <ExpenseStructureSection
        transactions={periodTx}
        categories={categories}
        accounts={accounts}
        periodLabel={PERIOD_LABELS[period]}
      />
    </div>
  )
}