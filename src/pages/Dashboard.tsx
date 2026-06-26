import { useState } from 'react'
import dayjs from 'dayjs'
import { useTransactionsByMonth, useAccounts, useCategories, useDebts, useAccountTypes, useBanks, useCashbackSummary } from '@/hooks/useDb'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

export default function Dashboard() {
  const now = dayjs()
  const [month, setMonth] = useState(now.month())
  const [year, setYear] = useState(now.year())
  const [expanded, setExpanded] = useState(false)

  const transactions = useTransactionsByMonth(year, month + 1) ?? []
  const accounts = useAccounts() ?? []
  const categories = useCategories() ?? []
  const debts = useDebts('active') ?? []

  const accountTypes = useAccountTypes() ?? []
  const banks = useBanks() ?? []
  const cashbackSummary = useCashbackSummary(year, month + 1) ?? []

  function getBankLabel(bankId: number) {
    const bank = banks.find((b) => b.id === bankId)
    return bank ? `${bank.icon} ${bank.name}` : ''
  }

  const typeKindMap = new Map(accountTypes.map((t) => [t.id!, t.kind]))
  const assetsBalance = accounts
    .filter((a) => typeKindMap.get(a.typeId) === 'regular')
    .reduce((s, a) => s + a.balance, 0)
  const liabilitiesBalance = accounts
    .filter((a) => typeKindMap.get(a.typeId) !== 'regular')
    .reduce((s, a) => s + a.balance, 0)
  const maxBalance = Math.max(assetsBalance, liabilitiesBalance, 1)
  const incomeTotal = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenseTotal = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const recentTx = [...transactions].slice(0, 5)

  const catMap = new Map(categories.map((c) => [c.id!, c]))

  const expensesByCat: Record<number, number> = {}
  for (const t of transactions) {
    if (t.type === 'expense') {
      const cat = catMap.get(t.categoryId!)
      const rootId = cat?.parentId ?? t.categoryId!
      expensesByCat[rootId] = (expensesByCat[rootId] ?? 0) + t.amount
    }
  }

  const pieData = Object.entries(expensesByCat)
    .map(([catId, amount]) => {
      const cat = catMap.get(Number(catId))
      if (!cat) return null
      return { name: cat.name, value: amount, color: cat.color }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
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
        <div className="flex-1 text-center">
          <div className="font-semibold">{MONTHS[month]} {year}</div>
          <div className="w-full space-y-1.5 mt-1">
            <div className="w-full h-7 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full flex items-center px-3"
                style={{ width: `${(assetsBalance / maxBalance) * 100}%` }}
              >
                <span className="text-white text-sm font-bold">{formatCurrency(assetsBalance)}</span>
              </div>
            </div>
            <div className="w-full h-7 bg-red-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 rounded-full flex items-center px-3"
                style={{ width: `${(liabilitiesBalance / maxBalance) * 100}%` }}
              >
                <span className="text-white text-sm font-bold">{formatCurrency(liabilitiesBalance)}</span>
              </div>
            </div>
          </div>
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

      {cashbackSummary.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">💳 Кешбек за месяц</span>
            <span className="text-green-600 font-bold">
              +{formatCurrency(cashbackSummary.reduce((s, g) => s + g.totalCashback, 0))}
            </span>
          </div>
          <div className="space-y-3">
            {(expanded ? cashbackSummary : cashbackSummary.slice(0, 2)).map(({ bank, totalCashback, items }) => (
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
                        +{formatCurrency(item.calculatedAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {cashbackSummary.length > 2 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-sm text-blue-600"
            >
              {expanded ? '← Свернуть' : `Ещё ${cashbackSummary.length - 2} ${cashbackSummary.length - 2 === 1 ? 'банк' : 'банка'} →`}
            </button>
          )}
        </div>
      )}

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
                        : `${account?.name} · ${getBankLabel(account?.bankId ?? 0)}`}
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