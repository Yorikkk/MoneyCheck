import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { Transaction, Category, Account, Bank } from '@/db/db'

const COLORS = ['#4CAF50', '#8BC34A', '#CDDC39', '#009688', '#2196F3', '#FFC107', '#FF9800', '#607D8B', '#795548', '#E91E63']

const CASHBACK_CATEGORY_NAMES = ['кешбек', 'кэшбэк']

interface BankPieDataItem {
  bankId: number | null
  name: string
  value: number
  color: string
}

interface Props {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  banks: Bank[]
  periodLabel: string
}

export function CashbackSection({ transactions, categories, accounts, banks, periodLabel }: Props) {
  const navigate = useNavigate()
  const [drillBankId, setDrillBankId] = useState<number | null>(null)
  const [drillInitialized, setDrillInitialized] = useState(false)

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id!, c])), [categories])

  const cashbackCategoryIds = useMemo(() => {
    const roots = categories.filter(
      (c) => c.type === 'income' && CASHBACK_CATEGORY_NAMES.includes(c.name.trim().toLowerCase())
    )
    const ids = new Set<number>()
    for (const root of roots) {
      if (root.id !== undefined) ids.add(root.id)
    }
    for (const c of categories) {
      if (c.parentId !== undefined && ids.has(c.parentId) && c.id !== undefined) {
        ids.add(c.id)
      }
    }
    return ids
  }, [categories])

  const cashbackTx = useMemo(
    () => transactions.filter(
      (t) => t.type === 'income' && t.categoryId !== undefined && cashbackCategoryIds.has(t.categoryId)
    ),
    [transactions, cashbackCategoryIds]
  )

  const pieData = useMemo(() => {
    const sums = new Map<number | null, number>()
    for (const tx of cashbackTx) {
      const account = accounts.find((a) => a.id === tx.accountId)
      const bank = banks.find((b) => b.id === account?.bankId)
      const bankId = bank?.id ?? null
      sums.set(bankId, (sums.get(bankId) ?? 0) + tx.amount)
    }
    return Array.from(sums.entries())
      .filter(([, value]) => value > 0)
      .map(([bankId, value]) => {
        const bank = banks.find((b) => b.id === bankId)
        return {
          bankId,
          name: bank?.name ?? 'Без банка',
          value,
          color: bank?.color ?? '#9E9E9E',
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [cashbackTx, accounts, banks])

  const total = useMemo(() => pieData.reduce((s, item) => s + item.value, 0), [pieData])

  const drillBank = useMemo(() => {
    if (!drillInitialized) return null
    const bank = banks.find((b) => b.id === drillBankId)
    return bank ?? (drillBankId === null ? { id: null as number | null, name: 'Без банка', icon: '🏦' } : null)
  }, [banks, drillBankId, drillInitialized])

  const drillTx = useMemo(() => {
    if (!drillInitialized) return []
    return cashbackTx
      .filter((t) => {
        const account = accounts.find((a) => a.id === t.accountId)
        const bankId = banks.find((b) => b.id === account?.bankId)?.id ?? null
        return bankId === drillBankId
      })
      .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
  }, [cashbackTx, accounts, banks, drillBankId, drillInitialized])

  function handleClick(item: BankPieDataItem) {
    setDrillBankId(item.bankId)
    setDrillInitialized(true)
  }

  function resetToRoot() {
    setDrillInitialized(false)
    setDrillBankId(null)
  }

  const headerText = `Кешбек за ${periodLabel}`

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-1 text-sm text-gray-500 mb-3 flex-wrap">
        <button onClick={resetToRoot} className="hover:text-blue-600 shrink-0">Все отчёты</button>
        <span className="shrink-0">›</span>
        {drillBank ? (
          <>
            <button onClick={resetToRoot} className="hover:text-blue-600 truncate max-w-[120px]">Кешбек</button>
            <span className="shrink-0">›</span>
            <span className="text-gray-900 font-medium truncate max-w-[120px]">{drillBank.icon} {drillBank.name}</span>
          </>
        ) : (
          <span className="text-gray-900 font-medium">{headerText}</span>
        )}
      </div>

      {drillBank ? (
        drillTx.length > 0 ? (
          <div className="space-y-2">
            {drillTx.map((tx) => {
              const cat = catMap.get(tx.categoryId!)
              const account = accounts.find((a) => a.id === tx.accountId)
              const bank = banks.find((b) => b.id === account?.bankId)
              return (
                <div
                  key={tx.id}
                  onClick={() => navigate('/add', { state: { editTx: tx } })}
                  className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 rounded p-1 -ml-1"
                >
                  <span className="text-lg">{cat?.icon ?? '💸'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">
                      {cat?.name ?? '—'}{tx.description ? `, ${tx.description}` : ''}
                    </div>
                    <div className="text-xs text-gray-400">
                      {dayjs(tx.date).format('D MMM')} · {account?.name ?? '—'}{bank ? ` · ${bank.icon} ${bank.name}` : ''}
                    </div>
                  </div>
                  <span className="font-semibold shrink-0 text-green-600">
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">Нет операций за этот период</div>
        )
      ) : pieData.length > 0 ? (
        <div>
          <div className="flex items-center gap-4">
            <div className="w-36 h-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                    {pieData.map((item, i) => (
                      <Cell
                        key={item.bankId ?? 'none'}
                        fill={COLORS[i % COLORS.length]}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleClick(item)}
                      />
                    ))}
                  </Pie>
                  {total > 0 && (
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: 14, fontWeight: 600, fill: '#374151' }}>
                      {formatCurrency(total)}
                    </text>
                  )}
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              {pieData.map((item, i) => (
                <div
                  key={item.bankId ?? 'none'}
                  onClick={() => handleClick(item)}
                  className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 rounded p-1 -ml-1"
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate flex-1">{item.name}</span>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">Нет кешбека за этот период</div>
      )}
    </div>
  )
}