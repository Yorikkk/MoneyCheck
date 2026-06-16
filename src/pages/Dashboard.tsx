import { useState } from 'react'
import dayjs from 'dayjs'
import { useTransactionsByMonth, useAccounts, useCategories, useDebts } from '@/hooks/useDb'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

export default function Dashboard() {
  const now = dayjs()
  const [month, setMonth] = useState(now.month())
  const [year, setYear] = useState(now.year())

  const transactions = useTransactionsByMonth(year, month + 1) ?? []
  const accounts = useAccounts() ?? []
  const categories = useCategories() ?? []
  const debts = useDebts('active') ?? []

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const incomeTotal = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenseTotal = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const recentTx = [...transactions].slice(0, 5)

  const expensesByCat: Record<number, number> = {}
  for (const t of transactions) {
    if (t.type === 'expense') {
      expensesByCat[t.categoryId!] = (expensesByCat[t.categoryId!] ?? 0) + t.amount
    }
  }

  const pieData = Object.entries(expensesByCat)
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === Number(catId))
      return { name: cat?.name ?? '?', value: amount, color: cat?.color ?? '#9E9E9E' }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else { setMonth(month - 1) }
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else { setMonth(month + 1) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
        <button onClick={prevMonth} className="text-blue-600 text-lg px-2">◀</button>
        <div className="text-center">
          <div className="font-semibold">{MONTHS[month]} {year}</div>
          <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
          <div className="text-xs text-gray-400">Общий баланс</div>
        </div>
        <button onClick={nextMonth} className="text-blue-600 text-lg px-2">▶</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 rounded-xl p-3 shadow-sm">
          <div className="text-xs text-green-600 font-medium">Доходы</div>
          <div className="text-lg font-bold text-green-700">{formatCurrency(incomeTotal)}</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 shadow-sm">
          <div className="text-xs text-red-600 font-medium">Расходы</div>
          <div className="text-lg font-bold text-red-700">{formatCurrency(expenseTotal)}</div>
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Расходы по категориям</div>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              {pieData.slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate flex-1">{item.name}</span>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {debts.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Активные долги</span>
            <span className="text-lg font-bold text-orange-600">{debts.length}</span>
          </div>
        </div>
      )}

      {recentTx.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-3">Последние операции</div>
          <div className="space-y-2">
            {recentTx.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId)
              const account = accounts.find((a) => a.id === tx.accountId)
              return (
                <div key={tx.id} className="flex items-center gap-3 text-sm">
                  <span className="text-lg">{tx.type === 'transfer' ? '🔄' : (cat?.icon ?? '📦')}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">
                      {tx.type === 'transfer'
                        ? `Перевод${tx.description ? `, ${tx.description}` : ''}`
                        : `${cat?.name ?? '—'}${tx.description ? `, ${tx.description}` : ''}`}
                    </div>
                    <div className="text-xs text-gray-400">
                      {dayjs(tx.date).format('D MMM')} · {tx.type === 'transfer'
                        ? `${account?.name} → ${accounts.find((a) => a.id === tx.transferToAccountId)?.name}`
                        : account?.name}
                    </div>
                  </div>
                  <span className={`font-semibold shrink-0 ${tx.type === 'transfer' ? 'text-blue-600' : tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'transfer' ? '' : tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Нет операций за этот месяц
        </div>
      )}
    </div>
  )
}