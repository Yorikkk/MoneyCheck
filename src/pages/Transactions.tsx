import { useState, useMemo, useEffect } from 'react'
import dayjs from 'dayjs'
import { useLocation } from 'react-router-dom'
import { useAllTransactions, useAccounts, useCategories, useRootCategories, useSubcategories } from '@/hooks/useDb'
import { deleteTransaction, updateTransaction, updateAccount, hasSubcategories } from '@/db'
import { formatCurrency } from '@/lib/utils'
import type { Transaction } from '@/db'

export default function Transactions() {
  const location = useLocation()
  const locationState = location.state as { filterAccount?: number } | null

  const allTx = useAllTransactions() ?? []
  const accounts = useAccounts() ?? []
  const categories = useCategories() ?? []

  const [filterAccount, setFilterAccount] = useState<number | null>(locationState?.filterAccount ?? null)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')
  const [editTx, setEditTx] = useState<Transaction | null>(null)

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
      if (fromAccount) await updateAccount(tx.accountId, { balance: fromAccount.balance + tx.amount })
      if (toAccount) await updateAccount(tx.transferToAccountId!, { balance: toAccount.balance - tx.amount })
    } else {
      const account = accounts.find((a) => a.id === tx.accountId)
      if (account) {
        const revert = tx.type === 'income' ? account.balance - tx.amount : account.balance + tx.amount
        await updateAccount(tx.accountId, { balance: revert })
      }
    }
    await deleteTransaction(tx.id!)
  }

  if (editTx) {
    return (
      <EditForm
        tx={editTx}
        accounts={accounts}
        onSave={async (changes) => {
          await updateTransaction(editTx.id!, changes)
          setEditTx(null)
        }}
        onCancel={() => setEditTx(null)}
      />
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">История</h1>

      <div className="flex gap-2 mb-4">
        <select
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          value={filterAccount ?? ''}
          onChange={(e) => setFilterAccount(Number(e.target.value) || null)}
        >
          <option value="">Все счета</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
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
                return (
                  <div
                    key={tx.id}
                    className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 cursor-pointer"
                    onClick={() => { if (tx.type !== 'transfer') setEditTx(tx) }}
                  >
                    {tx.type === 'transfer' ? (
                      <>
                        <span className="text-lg">🔄</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            Перевод {tx.description ? `, ${tx.description}` : ''}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {account?.name} → {accounts.find((a) => a.id === tx.transferToAccountId)?.name}
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
                          <div className="text-xs text-gray-400 truncate">{account?.name}</div>
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

function EditForm({
  tx, accounts, onSave, onCancel,
}: {
  tx: Transaction
  accounts: any[]
  onSave: (changes: Partial<Transaction>) => Promise<void>
  onCancel: () => void
}) {
  const [amount, setAmount] = useState(String(tx.amount))
  const [categoryId, setCategoryId] = useState(tx.categoryId)
  const [accountId, setAccountId] = useState(tx.accountId)
  const [date, setDate] = useState(dayjs(tx.date).format('YYYY-MM-DD'))
  const [description, setDescription] = useState(tx.description)
  const [mcc, setMcc] = useState(String(tx.mcc ?? ''))
  const [saving, setSaving] = useState(false)
  const [browseParent, setBrowseParent] = useState<any>(null)

  const txType = tx.type === 'transfer' ? undefined : tx.type
  const rootCategories = useRootCategories(txType) ?? []
  const subCategories = browseParent ? (useSubcategories(browseParent.id!) ?? []) : []
  const categories = browseParent ? subCategories : rootCategories

  const selectedCategory = (browseParent ? subCategories : rootCategories).find((c) => c.id === categoryId)

  async function handleSave() {
    setSaving(true)
    await onSave({
      amount: Number(amount) || 0,
      categoryId,
      accountId,
      date: new Date(date),
      description: description.trim(),
      mcc: mcc ? Number(mcc) : undefined,
    })
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onCancel} className="text-blue-600 text-lg">←</button>
        <h2 className="text-xl font-bold">Редактировать</h2>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <input
          type="number"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {txType && (
          <div>
            {browseParent && (
              <button
                onClick={() => setBrowseParent(null)}
                className="text-sm text-blue-600 mb-2 flex items-center gap-1"
              >
                ← {browseParent.icon} {browseParent.name}
              </button>
            )}
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={async () => {
                    const hasSubs = await hasSubcategories(cat.id!)
                    if (hasSubs) {
                      setBrowseParent(cat)
                    } else {
                      setCategoryId(cat.id!)
                      if (!mcc && cat.mcc) {
                        setMcc(String(cat.mcc))
                      }
                      setBrowseParent(null)
                    }
                  }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    categoryId === cat.id
                      ? 'bg-blue-50 ring-2 ring-blue-500'
                      : 'bg-white shadow-sm'
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs truncate w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
            {selectedCategory && (
              <div className="mt-1">
                <input
                  type="number"
                  value={mcc}
                  onChange={(e) => setMcc(e.target.value)}
                  className="w-full text-xs font-mono text-center border border-gray-200 rounded-lg px-2 py-1.5"
                  placeholder={`MCC-код${selectedCategory.mcc ? ` (из категории: ${selectedCategory.mcc})` : ''}`}
                />
              </div>
            )}
          </div>
        )}
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
          value={accountId}
          onChange={(e) => setAccountId(Number(e.target.value))}
        >
          {accounts.map((a: any) => (
            <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
          ))}
        </select>
        <input
          type="date"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium"
        >
          {saving ? '...' : 'Сохранить'}
        </button>
        <button onClick={onCancel} className="w-full py-2.5 rounded-lg border border-gray-300 text-sm">
          Отмена
        </button>
      </div>
    </div>
  )
}