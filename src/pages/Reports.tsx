import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { useAllTransactions, useAccounts, useCategories } from '@/hooks/useDb'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
const COLORS = ['#F44336', '#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#009688', '#4CAF50', '#FF9800', '#795548', '#607D8B']

export default function Reports() {
  const now = dayjs()
  const [period, setPeriod] = useState(3)
  const allTx = useAllTransactions() ?? []
  const accounts = useAccounts() ?? []
  const categories = useCategories() ?? []

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

  const currentTx = allTx.filter((t) => {
    const d = dayjs(t.date)
    return d.month() + 1 === now.month() + 1 && d.year() === now.year()
  })

  const catSpending: Record<number, number> = {}
  for (const tx of currentTx) {
    if (tx.type === 'expense') {
      catSpending[tx.categoryId] = (catSpending[tx.categoryId] ?? 0) + tx.amount
    }
  }

  const pieData = Object.entries(catSpending)
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === Number(catId))
      return { name: cat?.name ?? '?', value: amount, color: cat?.color ?? '#9E9E9E' }
    })
    .sort((a, b) => b.value - a.value)

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

      {pieData.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-3">Структура расходов за месяц</div>
          <div className="flex items-center gap-4">
            <div className="w-36 h-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              {pieData.slice(0, 8).map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate flex-1">{item.name}</span>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="text-sm font-medium text-gray-500 mb-3">Остатки по счетам</div>
        <div className="space-y-2">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 text-sm">
              <span className="text-lg">{a.icon}</span>
              <span className="flex-1">{a.name}</span>
              <span className="font-semibold">{formatCurrency(a.balance)}</span>
            </div>
          ))}
          {accounts.length === 0 && <div className="text-sm text-gray-400">Нет счетов</div>}
        </div>
      </div>
    </div>
  )
}