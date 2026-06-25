import { useState, useMemo, useEffect } from 'react'
import dayjs from 'dayjs'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAllTransactions, useAccounts, useCategories, useBanks, useAccountTypes, useCashbackForTransactions } from '@/hooks/useDb'
import { deleteTransaction, updateAccount } from '@/db'
import { formatCurrency } from '@/lib/utils'
import type { Transaction } from '@/db'

export default function Transactions() {
  const location = useLocation()
  const locationState = location.state as { filterAccount?: number } | null
  const navigate = useNavigate()

  const allTx = useAllTransactions() ?? []
  const accounts = useAccounts() ?? []
  const categories = useCategories() ?? []
  const banks = useBanks() ?? []
  const accountTypes = useAccountTypes() ?? []
  const getCashback = useCashbackForTransactions() ?? (() => 0)

  const typeKindMap: Record<number, string> = {}
  for (const t of accountTypes) {
    if (t.id != null) typeKindMap[t.id] = t.kind
  }

  function getBankLabel(bankId: number) {
    const bank = banks.find((b) => b.id === bankId)
    return bank ? `${bank.icon} ${bank.name}` : ''
  }

  const [filterAccount, setFilterAccount] = useState<number | null>(locationState?.filterAccount ?? null)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')

  useEffect(() => {
    if (locationState?.filterAccount) {
      setFilterAccount(locationState.filterAccount)
    }
  }, [locationState?.filterAccount])

  const filtered = useMemo(() => {
    let list = allTx
    if (filterAccount) list = list.filter((t) => t.accountId === filterAccount || t.transferToAccountId === filterAccount)
    if (filterType !== 'all') list = list.filter((t) => t.type === filterType)
    return list
  }, [allTx, filterAccount, filterType])

  const groups = useMemo(() => {
    const map: Record<string, Transaction[]> = {}
    for (const tx of filtered) {
      const key = dayjs(tx.date).format('YYYY-MM-DD')
      if (!map[key]) map[key] = []
      map[key].push(tx)
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  async function handleDelete(tx: Transaction) {
    if (!confirm('Удалить транзакцию?')) return

    if (tx.type === 'transfer') {
      const fromAccount = accounts.find((a) => a.id === tx.accountId)
      const toAccount = accounts.find((a) => a.id === tx.transferToAccountId)
      if (fromAccount) {
        const fromKind = typeKindMap[fromAccount.typeId]
        const fromEffect = fromKind === 'credit' ? tx.amount : -tx.amount
        await updateAccount(tx.accountId, { balance: fromAccount.balance - fromEffect })
      }
      if (toAccount) {
        const toKind = typeKindMap[toAccount.typeId]
        const toEffect = toKind === 'mortgage' && tx.principalAmount
          ? -tx.principalAmount
          : toKind === 'credit'
            ? -tx.amount
            : tx.amount
        await updateAccount(tx.transferToAccountId!, { balance: toAccount.balance - toEffect })
      }
    } else {
      const account = accounts.find((a) => a.id === tx.accountId)
      if (account) {
        const kind = typeKindMap[account.typeId]
        let effect: number
        if (kind === 'credit') {
          effect = tx.type === 'income' ? -tx.amount : tx.amount
        } else if (kind === 'mortgage' && tx.principalAmount) {
          effect = -tx.principalAmount
        } else {
          effect = tx.type === 'income' ? tx.amount : -tx.amount
        }
        await updateAccount(tx.accountId, { balance: account.balance - effect })
      }
    }
    await deleteTransaction(tx.id!)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">История</h1>
        <button
          onClick={() => navigate('/add', { state: { accountId: filterAccount } })}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white text-lg font-bold"
        >
          +
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <select
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          value={filterAccount ?? ''}
          onChange={(e) => setFilterAccount(Number(e.target.value) || null)}
        >
          <option value="">Все счета</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.icon} {a.name} · {getBankLabel(a.bankId)}</option>
          ))}
        </select>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as typeof filterType)}
        >
          <option value="all">Все</option>
          <option value="expense">Расходы</option>
          <option value="income">Доходы</option>
          <option value="transfer">Переводы</option>
        </select>
      </div>

      {groups.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">Нет транзакций</div>
      )}

      <div className="space-y-4">
        {groups.map(([dateKey, txs]) => (
          <div key={dateKey}>
            <div className="text-xs text-gray-400 font-medium mb-1.5 px-1">
              {dayjs(dateKey).format('D MMM YYYY')} {dayjs(dateKey).isSame(dayjs(), 'day') ? '· сегодня' : ''}
            </div>
            <div className="space-y-1">
              {txs.map((tx) => {
                const cat = categories.find((c) => c.id === tx.categoryId)
const account = accounts.find((a) => a.id === tx.accountId)
                const toAccount = accounts.find((a) => a.id === tx.transferToAccountId)
                const cashback = tx.type === 'expense' ? getCashback(tx) : 0
                return (
                  <div
                    key={tx.id}
                    className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate('/add', { state: { editTx: tx } })}
                  >
                    {tx.type === 'transfer' ? (
                      <>
                        <span className="text-lg">🔄</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            Перевод {tx.description ? `, ${tx.description}` : ''}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {account?.name} · {getBankLabel(account?.bankId ?? 0)} → {toAccount?.name} · {getBankLabel(toAccount?.bankId ?? 0)}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold text-blue-600">
                            {formatCurrency(tx.amount)}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(tx) }}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">{cat?.icon ?? '📦'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{cat?.name ?? '—'}{tx.description ? `, ${tx.description}` : ''}</div>
                          <div className="text-xs text-gray-400 truncate">{account?.name} · {getBankLabel(account?.bankId ?? 0)}</div>
                          {(tx.mcc ?? cat?.mcc) && (
                            <div className="text-xs text-gray-400 font-mono">MCC {tx.mcc ?? cat?.mcc}</div>
                          )}
                          {tx.principalAmount && (
                            <div className="text-xs text-orange-500">Тело: {formatCurrency(tx.principalAmount)}</div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </div>
                          {cashback > 0 && (
                            <div className="text-xs text-green-500 font-medium">💳 +{formatCurrency(cashback)}</div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(tx) }}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

