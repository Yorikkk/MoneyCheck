import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { Transaction, Account, Bank, AccountType } from '@/db/db'

const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#009688', '#FFC107', '#607D8B', '#795548', '#8BC34A']

const TARGET_TYPE_NAMES = ['биржевой счет', 'нпф']

interface TypePieDataItem {
  typeId: number
  name: string
  icon: string
  value: number
  color: string
}

interface AccountPieDataItem {
  accountId: number
  name: string
  value: number
  color: string
}

interface Props {
  transactions: Transaction[]
  accounts: Account[]
  banks: Bank[]
  accountTypes: AccountType[]
  periodLabel: string
}

export function InvestmentTransfersSection({ transactions, accounts, banks, accountTypes, periodLabel }: Props) {
  const navigate = useNavigate()
  const [drillTypeId, setDrillTypeId] = useState<number | null>(null)
  const [drillAccountId, setDrillAccountId] = useState<number | null>(null)
  const [drillInitialized, setDrillInitialized] = useState(false)

  const targetTypeIds = useMemo(() => {
    const ids = new Set<number>()
    for (const t of accountTypes) {
      const norm = t.name.trim().toLowerCase().replace(/ё/g, 'е')
      if (TARGET_TYPE_NAMES.includes(norm) && t.id !== undefined) ids.add(t.id)
    }
    return ids
  }, [accountTypes])

  const targetAccounts = useMemo(
    () => accounts.filter((a) => targetTypeIds.has(a.typeId)),
    [accounts, targetTypeIds]
  )

  const targetAccountIds = useMemo(
    () => new Set(targetAccounts.map((a) => a.id!)),
    [targetAccounts]
  )

  const transfers = useMemo(
    () => transactions.filter(
      (t) => t.type === 'transfer' && t.transferToAccountId !== undefined && targetAccountIds.has(t.transferToAccountId)
    ),
    [transactions, targetAccountIds]
  )

  const rootPieData = useMemo(() => {
    const sums = new Map<number, number>()
    for (const tx of transfers) {
      const toAcc = accounts.find((a) => a.id === tx.transferToAccountId)
      if (!toAcc) continue
      sums.set(toAcc.typeId, (sums.get(toAcc.typeId) ?? 0) + tx.amount)
    }
    return Array.from(sums.entries())
      .filter(([, value]) => value > 0)
      .map(([typeId, value]) => {
        const type = accountTypes.find((t) => t.id === typeId)
        return {
          typeId,
          name: type?.name ?? '—',
          icon: type?.icon ?? '🏦',
          value,
          color: type?.color ?? '#9E9E9E',
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [transfers, accounts, accountTypes])

  const subPieData = useMemo(() => {
    if (drillTypeId == null) return []
    const sums = new Map<number, number>()
    for (const tx of transfers) {
      const toAcc = accounts.find((a) => a.id === tx.transferToAccountId)
      if (!toAcc || toAcc.typeId !== drillTypeId) continue
      sums.set(toAcc.id!, (sums.get(toAcc.id!) ?? 0) + tx.amount)
    }
    return Array.from(sums.entries())
      .filter(([, value]) => value > 0)
      .map(([accountId, value]) => {
        const acc = accounts.find((a) => a.id === accountId)
        return {
          accountId,
          name: acc?.name ?? '—',
          value,
          color: acc?.color ?? '#9E9E9E',
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [transfers, accounts, drillTypeId])

  const drillType = useMemo(() => {
    if (!drillInitialized) return null
    return accountTypes.find((t) => t.id === drillTypeId) ?? null
  }, [accountTypes, drillTypeId, drillInitialized])

  const drillAccount = useMemo(() => {
    if (!drillInitialized || drillAccountId == null) return null
    return accounts.find((a) => a.id === drillAccountId) ?? null
  }, [accounts, drillAccountId, drillInitialized])

  const drillTx = useMemo(() => {
    if (drillAccountId == null) return []
    return transfers
      .filter((t) => t.transferToAccountId === drillAccountId)
      .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
  }, [transfers, drillAccountId])

  const currentPieData = drillType && drillAccountId == null ? subPieData : rootPieData

  const total = useMemo(() => currentPieData.reduce((s, item) => s + item.value, 0), [currentPieData])

  function handleRootClick(item: TypePieDataItem) {
    const accs = targetAccounts.filter((a) => a.typeId === item.typeId)
    setDrillTypeId(item.typeId)
    setDrillInitialized(true)
    setDrillAccountId(accs.length === 1 ? accs[0].id! : null)
  }

  function handleAccountClick(item: AccountPieDataItem) {
    setDrillAccountId(item.accountId)
  }

  function resetToRoot() {
    setDrillInitialized(false)
    setDrillTypeId(null)
    setDrillAccountId(null)
  }

  function resetToType() {
    setDrillAccountId(null)
  }

  const headerText = `Переводы на инвестиционные счета за ${periodLabel}`

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-1 text-sm text-gray-500 mb-3 flex-wrap">
        <button onClick={resetToRoot} className="hover:text-blue-600 shrink-0">Все отчёты</button>
        <span className="shrink-0">›</span>
        {drillAccount ? (
          <>
            <button onClick={resetToRoot} className="hover:text-blue-600 truncate max-w-[120px]">Инвестиции</button>
            <span className="shrink-0">›</span>
            <button onClick={resetToType} className="hover:text-blue-600 truncate max-w-[120px]">{drillType?.icon} {drillType?.name}</button>
            <span className="shrink-0">›</span>
            <span className="text-gray-900 font-medium truncate max-w-[120px]">{drillAccount.icon} {drillAccount.name}</span>
          </>
        ) : drillType ? (
          <>
            <button onClick={resetToRoot} className="hover:text-blue-600 truncate max-w-[120px]">Инвестиции</button>
            <span className="shrink-0">›</span>
            <span className="text-gray-900 font-medium truncate max-w-[120px]">{drillType.icon} {drillType.name}</span>
          </>
        ) : (
          <span className="text-gray-900 font-medium">{headerText}</span>
        )}
      </div>

      {drillAccount ? (
        drillTx.length > 0 ? (
          <div className="space-y-2">
            {drillTx.map((tx) => {
              const fromAcc = accounts.find((a) => a.id === tx.accountId)
              const fromBank = banks.find((b) => b.id === fromAcc?.bankId)
              return (
                <div
                  key={tx.id}
                  onClick={() => navigate('/add', { state: { editTx: tx } })}
                  className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 rounded p-1 -ml-1"
                >
                  <span className="text-lg">🔄</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">
                      Перевод{tx.description ? `, ${tx.description}` : ''}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {dayjs(tx.date).format('D MMM')} · {fromAcc?.name ?? '—'}{fromBank ? ` · ${fromBank.icon} ${fromBank.name}` : ''} → {drillAccount.name}
                    </div>
                  </div>
                  <span className="font-semibold shrink-0 text-blue-600">
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">Нет операций за этот период</div>
        )
      ) : drillType ? (
        subPieData.length > 0 ? (
          <div>
            <div className="flex items-center gap-4">
              <div className="w-36 h-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={subPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                      {subPieData.map((item, i) => (
                        <Cell
                          key={item.accountId}
                          fill={COLORS[i % COLORS.length]}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleAccountClick(item)}
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
                {subPieData.map((item, i) => (
                  <div
                    key={item.accountId}
                    onClick={() => handleAccountClick(item)}
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
          <div className="text-center py-8 text-gray-400 text-sm">Нет операций за этот период</div>
        )
      ) : rootPieData.length > 0 ? (
        <div>
          <div className="flex items-center gap-4">
            <div className="w-36 h-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={rootPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                    {rootPieData.map((item, i) => (
                      <Cell
                        key={item.typeId}
                        fill={COLORS[i % COLORS.length]}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRootClick(item)}
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
              {rootPieData.map((item, i) => (
                <div
                  key={item.typeId}
                  onClick={() => handleRootClick(item)}
                  className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 rounded p-1 -ml-1"
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate flex-1">{item.icon} {item.name}</span>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">Нет переводов на инвестиционные счета за этот период</div>
      )}
    </div>
  )
}