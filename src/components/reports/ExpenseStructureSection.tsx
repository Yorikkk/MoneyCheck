import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { Transaction, Category, Account, Bank, AccountType } from '@/db/db'

const COLORS = ['#F44336', '#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#009688', '#4CAF50', '#FF9800', '#795548', '#607D8B']

interface PieDataItem {
  key: string
  name: string
  value: number
  catId?: number
  typeId?: number
  accountId?: number
  icon?: string
}

interface Props {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  banks: Bank[]
  accountTypes: AccountType[]
  periodLabel: string
}

export function ExpenseStructureSection({ transactions, categories, accounts, banks, accountTypes, periodLabel }: Props) {
  const navigate = useNavigate()
  const [drillCategory, setDrillCategory] = useState<Category | null>(null)
  const [drillSubcategory, setDrillSubcategory] = useState<Category | null>(null)
  const [drillCreditType, setDrillCreditType] = useState<AccountType | null>(null)
  const [drillCreditAccount, setDrillCreditAccount] = useState<Account | null>(null)

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id!, c])), [categories])
  const expenseTx = useMemo(() => transactions.filter((t) => t.type === 'expense'), [transactions])

  const creditTypeIds = useMemo(() => {
    const ids = new Set<number>()
    for (const t of accountTypes) {
      if ((t.kind === 'credit' || t.kind === 'mortgage') && t.id !== undefined) ids.add(t.id)
    }
    return ids
  }, [accountTypes])

  const creditAccountIds = useMemo(
    () => new Set(accounts.filter((a) => creditTypeIds.has(a.typeId)).map((a) => a.id!)),
    [accounts, creditTypeIds]
  )

  const creditTransfers = useMemo(
    () =>
      transactions.filter(
        (t) => t.type === 'transfer' && t.transferToAccountId !== undefined && creditAccountIds.has(t.transferToAccountId)
      ),
    [transactions, creditAccountIds]
  )

  const rootPieData = useMemo(() => {
    const spending: Record<number, number> = {}
    for (const tx of expenseTx) {
      const cat = catMap.get(tx.categoryId!)
      const rootId = cat?.parentId ?? tx.categoryId!
      spending[rootId] = (spending[rootId] ?? 0) + tx.amount
    }
    const catSlices = Object.entries(spending)
      .map(([catId, value]): PieDataItem | null => {
        const cat = catMap.get(Number(catId))
        if (!cat) return null
        return { key: `c${cat.id}`, catId: cat.id!, name: cat.name, value }
      })
      .filter((x): x is PieDataItem => x !== null)

    const typeSums = new Map<number, number>()
    for (const tx of creditTransfers) {
      const toAcc = accounts.find((a) => a.id === tx.transferToAccountId)
      if (!toAcc) continue
      typeSums.set(toAcc.typeId, (typeSums.get(toAcc.typeId) ?? 0) + tx.amount)
    }
    const typeSlices = Array.from(typeSums.entries())
      .filter(([, value]) => value > 0)
      .map(([typeId, value]) => {
        const type = accountTypes.find((t) => t.id === typeId)
        return { key: `t${typeId}`, typeId, name: type?.name ?? '—', icon: type?.icon ?? '🏦', value }
      })

    return [...catSlices, ...typeSlices].sort((a, b) => b.value - a.value)
  }, [expenseTx, catMap, creditTransfers, accounts, accountTypes])

  const subcatPieData = useMemo(() => {
    if (!drillCategory) return []
    const spending: Record<number, number> = {}
    for (const tx of expenseTx) {
      const cat = catMap.get(tx.categoryId!)
      if (cat && cat.parentId === drillCategory.id) {
        spending[cat.id!] = (spending[cat.id!] ?? 0) + tx.amount
      }
    }
    return Object.entries(spending)
      .map(([catId, value]): PieDataItem | null => {
        const cat = catMap.get(Number(catId))
        if (!cat) return null
        return { key: `c${cat.id}`, catId: cat.id!, name: cat.name, value }
      })
      .filter((x): x is PieDataItem => x !== null)
      .sort((a, b) => b.value - a.value)
  }, [expenseTx, catMap, drillCategory])

  const creditAccountPieData = useMemo(() => {
    if (!drillCreditType) return []
    const sums = new Map<number, number>()
    for (const tx of creditTransfers) {
      const toAcc = accounts.find((a) => a.id === tx.transferToAccountId)
      if (!toAcc || toAcc.typeId !== drillCreditType.id) continue
      sums.set(toAcc.id!, (sums.get(toAcc.id!) ?? 0) + tx.amount)
    }
    return Array.from(sums.entries())
      .filter(([, value]) => value > 0)
      .map(([accountId, value]) => {
        const acc = accounts.find((a) => a.id === accountId)
        return { key: `a${accountId}`, accountId, name: acc?.name ?? '—', icon: acc?.icon, value }
      })
      .sort((a, b) => b.value - a.value)
  }, [creditTransfers, accounts, drillCreditType])

  const currentPieData = drillCreditType
    ? creditAccountPieData
    : drillCategory && !drillSubcategory
      ? subcatPieData
      : rootPieData

  const total = useMemo(() => currentPieData.reduce((s, item) => s + item.value, 0), [currentPieData])

  const drillTx = useMemo(() => {
    if (!drillSubcategory) return []
    return expenseTx
      .filter((t) => t.categoryId === drillSubcategory.id)
      .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
  }, [expenseTx, drillSubcategory])

  const creditTx = useMemo(() => {
    if (!drillCreditAccount) return []
    return creditTransfers
      .filter((t) => t.transferToAccountId === drillCreditAccount.id)
      .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
  }, [creditTransfers, drillCreditAccount])

  function handleItemClick(item: PieDataItem) {
    if (item.accountId !== undefined) {
      setDrillCreditAccount(accounts.find((a) => a.id === item.accountId) ?? null)
      return
    }
    if (item.typeId !== undefined) {
      const type = accountTypes.find((t) => t.id === item.typeId)
      if (!type) return
      const accs = accounts.filter((a) => a.typeId === type.id)
      setDrillCategory(null)
      setDrillSubcategory(null)
      setDrillCreditType(type)
      setDrillCreditAccount(accs.length === 1 ? accs[0] : null)
      return
    }
    const cat = catMap.get(item.catId!)
    if (!cat) return
    setDrillCreditType(null)
    setDrillCreditAccount(null)
    if (drillCategory) {
      setDrillSubcategory(cat)
    } else {
      const subs = categories.filter((c) => c.parentId === cat.id && c.type === 'expense')
      setDrillCategory(cat)
      setDrillSubcategory(subs.length === 0 ? cat : null)
    }
  }

  function resetToRoot() {
    setDrillCategory(null)
    setDrillSubcategory(null)
    setDrillCreditType(null)
    setDrillCreditAccount(null)
  }

  function resetToCategory() {
    setDrillSubcategory(null)
  }

  function resetToCreditType() {
    setDrillCreditAccount(null)
  }

  const headerText = drillCategory
    ? `Структура расходов: ${drillCategory.name}`
    : `Структура расходов за ${periodLabel}`

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-1 text-sm text-gray-500 mb-3 flex-wrap">
        <button onClick={resetToRoot} className="hover:text-blue-600 shrink-0">Все отчёты</button>
        <span className="shrink-0">›</span>
        {drillCreditAccount ? (
          <>
            <button onClick={resetToCreditType} className="hover:text-blue-600 truncate max-w-[120px]">
              {drillCreditType?.icon} {drillCreditType?.name}
            </button>
            <span className="shrink-0">›</span>
            <span className="text-gray-900 font-medium truncate max-w-[120px]">{drillCreditAccount.icon} {drillCreditAccount.name}</span>
          </>
        ) : drillCreditType ? (
          <span className="text-gray-900 font-medium truncate max-w-[120px]">{drillCreditType.icon} {drillCreditType.name}</span>
        ) : drillCategory ? (
          <>
            <button onClick={resetToCategory} className="hover:text-blue-600 truncate max-w-[120px]">{drillCategory.name}</button>
            {drillSubcategory ? (
              <>
                <span className="shrink-0">›</span>
                <span className="text-gray-900 font-medium truncate max-w-[120px]">{drillSubcategory.name}</span>
              </>
            ) : (
              <span className="text-gray-900 font-medium truncate max-w-[120px]">{headerText}</span>
            )}
          </>
        ) : (
          <span className="text-gray-900 font-medium">{headerText}</span>
        )}
      </div>

      {drillCreditAccount ? (
        creditTx.length > 0 ? (
          <div className="space-y-2">
            {creditTx.map((tx) => {
              const fromAcc = accounts.find((a) => a.id === tx.accountId)
              const fromBank = banks.find((b) => b.id === fromAcc?.bankId)
              return (
                <div
                  key={tx.id}
                  onClick={() => navigate('/add', { state: { editTx: tx } })}
                  className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 rounded p-1 -ml-1"
                >
                  <span className="text-lg">{drillCreditType?.icon ?? '🔄'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">
                      Перевод{tx.description ? `, ${tx.description}` : ''}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {dayjs(tx.date).format('D MMM')} · {fromAcc?.name ?? '—'}{fromBank ? ` · ${fromBank.icon} ${fromBank.name}` : ''} → {drillCreditAccount.name}
                    </div>
                  </div>
                  <span className="font-semibold shrink-0 text-red-600">
                    -{formatCurrency(tx.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">Нет операций за этот период</div>
        )
      ) : drillSubcategory ? (
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
                  <span className="text-lg">{cat?.icon ?? '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">
                      {cat?.name ?? '—'}{tx.description ? `, ${tx.description}` : ''}
                    </div>
                    <div className="text-xs text-gray-400">
                      {dayjs(tx.date).format('D MMM')} · {account?.name ?? '—'}{bank ? ` · ${bank.icon} ${bank.name}` : ''}
                    </div>
                  </div>
                  <span className="font-semibold shrink-0 text-red-600">
                    -{formatCurrency(tx.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">Нет операций за этот период</div>
        )
      ) : currentPieData.length > 0 ? (
        <div>
          <div className="flex items-center gap-4">
            <div className="w-36 h-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={currentPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                    {currentPieData.map((item, i) => (
                      <Cell
                        key={item.key}
                        fill={COLORS[i % COLORS.length]}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleItemClick(item)}
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
              {currentPieData.map((item, i) => (
                <div
                  key={item.key}
                  onClick={() => handleItemClick(item)}
                  className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 rounded p-1 -ml-1"
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate flex-1">{item.icon ? `${item.icon} ${item.name}` : item.name}</span>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">
          {drillCreditType ? 'Нет операций за этот период' : 'Нет расходов за этот период'}
        </div>
      )}
    </div>
  )
}
