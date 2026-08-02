import { useState } from 'react'

import { useTransactionsByMonth, useDebts, useCashbackSummary } from '@/hooks/useDb'
import { formatCurrency } from '@/lib/utils'

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

export default function Dashboard() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())

  const transactions = useTransactionsByMonth(year, month + 1) ?? []
  const debts = useDebts('active') ?? []

  const cashbackSummary = useCashbackSummary(year, month + 1) ?? []

  const incomeTotal = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenseTotal = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const maxVal = Math.max(incomeTotal, expenseTotal, 1)

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
        <div className="flex-1 text-center">
          <div className="font-semibold">{MONTHS[month]} {year}</div>
          <div className="space-y-1.5 mt-1.5">
            <div className="w-full h-7 bg-green-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-full flex items-center px-3"
                style={{ width: `${(incomeTotal / maxVal) * 100}%` }}
              >
                <span className="text-white text-sm font-bold">+{formatCurrency(incomeTotal)}</span>
              </div>
            </div>
            <div className="w-full h-7 bg-red-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 rounded-full flex items-center px-3"
                style={{ width: `${(expenseTotal / maxVal) * 100}%` }}
              >
                <span className="text-white text-sm font-bold">−{formatCurrency(expenseTotal)}</span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={nextMonth} className="text-blue-600 text-lg px-2">▶</button>
      </div>

      {cashbackSummary.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">💳 Кешбек за месяц</span>
            <span className="text-green-600 font-bold">
              +{formatCurrency(cashbackSummary.reduce((s, g) => s + g.totalCashback, 0))}
            </span>
          </div>
          <div className="space-y-3">
            {cashbackSummary.map(({ bank, totalCashback, items }) => (
              <div key={bank.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{bank.icon}</span>
                    <span className="text-sm font-medium">{bank.name}</span>
                  </div>
                  <span className={`font-semibold text-sm ${totalCashback > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    +{formatCurrency(totalCashback)}
                  </span>
                </div>
                <div className="ml-8 space-y-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-400"> {item.percent}%</span>
                        {item.categoryName && <span className="text-xs text-gray-400"> · {item.categoryName}</span>}
                        {item.dateRange && <span className="text-xs text-gray-400"> · {item.dateRange}</span>}
                      </div>
                      <span className={`font-semibold shrink-0 ml-2 ${item.calculatedAmount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        +{formatCurrency(item.calculatedAmount)}{item.maxAmount ? ` / ${formatCurrency(item.maxAmount)}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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

      {transactions.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Нет операций за этот месяц
        </div>
      )}
    </div>
  )
}