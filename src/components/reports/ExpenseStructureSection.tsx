import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { Transaction, Category, Account } from '@/db/db'

const COLORS = ['#F44336', '#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#009688', '#4CAF50', '#FF9800', '#795548', '#607D8B']

interface PieDataItem {
  catId: number
  name: string
  value: number
  color: string
}

interface Props {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  periodLabel: string
}

export function ExpenseStructureSection({ transactions, categories, accounts, periodLabel }: Props) {
  const [drillCategory, setDrillCategory] = useState<Category | null>(null)
  const [drillSubcategory, setDrillSubcategory] = useState<Category | null>(null)

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id!, c])), [categories])
  const expenseTx = useMemo(() => transactions.filter((t) => t.type === 'expense'), [transactions])

  const rootPieData = useMemo(() => {
    const spending: Record<number, number> = {}
    for (const tx of expenseTx) {
      const cat = catMap.get(tx.categoryId!)
      const rootId = cat?.parentId ?? tx.categoryId!
      spending[rootId] = (spending[rootId] ?? 0) + tx.amount
    }
    return Object.entries(spending)
      .map(([catId, value]) => {
        const cat = catMap.get(Number(catId))
        if (!cat) return null
        return { catId: cat.id!, name: cat.name, value, color: cat.color }
      })
      .filter((x): x is PieDataItem => x !== null)
      .sort((a, b) => b.value - a.value)
  }, [expenseTx, catMap])

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
      .map(([catId, value]) => {
        const cat = catMap.get(Number(catId))
        if (!cat) return null
        return { catId: cat.id!, name: cat.name, value, color: cat.color }
      })
      .filter((x): x is PieDataItem => x !== null)
      .sort((a, b) => b.value - a.value)
  }, [expenseTx, catMap, drillCategory])

  const drillTx = useMemo(() => {
    if (!drillSubcategory) return []
    return expenseTx
      .filter((t) => t.categoryId === drillSubcategory.id)
      .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
  }, [expenseTx, drillSubcategory])

  function handleRootClick(item: PieDataItem) {
    const cat = catMap.get(item.catId)
    if (!cat) return
    const subs = categories.filter((c) => c.parentId === cat.id && c.type === 'expense')
    setDrillCategory(cat)
    setDrillSubcategory(subs.length === 0 ? cat : null)
  }

  function handleSubcatClick(item: PieDataItem) {
    const cat = catMap.get(item.catId)
    if (!cat) return
    setDrillSubcategory(cat)
  }

  function resetToRoot() {
    setDrillCategory(null)
    setDrillSubcategory(null)
  }

  function resetToCategory() {
    setDrillSubcategory(null)
  }

  const headerText = drillCategory
    ? `Структура расходов: ${drillCategory.name}`
    : `Структура расходов за ${periodLabel}`

  const currentPieData = drillCategory && !drillSubcategory ? subcatPieData : rootPieData

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-1 text-sm text-gray-500 mb-3 flex-wrap">
        <button onClick={resetToRoot} className="hover:text-blue-600 shrink-0">Все отчёты</button>
        <span className="shrink-0">›</span>
        {drillCategory ? (
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

      {drillSubcategory ? (
        drillTx.length > 0 ? (
          <div className="space-y-2">
            {drillTx.map((tx) => {
              const cat = catMap.get(tx.categoryId!)
              const account = accounts.find((a) => a.id === tx.accountId)
              return (
                <div key={tx.id} className="flex items-center gap-3 text-sm">
                  <span className="text-lg">{cat?.icon ?? '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">
                      {cat?.name ?? '—'}{tx.description ? `, ${tx.description}` : ''}
                    </div>
                    <div className="text-xs text-gray-400">
                      {dayjs(tx.date).format('D MMM')} · {account?.name ?? '—'}
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
                        key={item.catId}
                        fill={COLORS[i % COLORS.length]}
                        style={{ cursor: 'pointer' }}
                        onClick={() => (drillCategory ? handleSubcatClick : handleRootClick)(item)}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              {currentPieData.slice(0, 8).map((item, i) => (
                <div
                  key={item.catId}
                  onClick={() => (drillCategory ? handleSubcatClick : handleRootClick)(item)}
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
        <div className="text-center py-8 text-gray-400 text-sm">Нет расходов за этот период</div>
      )}
    </div>
  )
}