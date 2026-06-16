import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useCategories, useAccounts, useAccountTypes } from '@/hooks/useDb'
import { addTransaction, updateAccount } from '@/db'
import { formatCurrency } from '@/lib/utils'

type Tab = 'expense' | 'income' | 'transfer'

export default function AddExpense() {
  const navigate = useNavigate()
  const [type, setType] = useState<Tab>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [accountId, setAccountId] = useState<number | null>(null)
  const [transferToAccountId, setTransferToAccountId] = useState<number | null>(null)
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [description, setDescription] = useState('')
  const [principalAmount, setPrincipalAmount] = useState('')
  const [interestAmount, setInterestAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [place, setPlace] = useState('')

  const placeError = place.length > 30 ? 'Максимум 30 символов' : ''

  const categories = useCategories(type === 'transfer' ? undefined : type) ?? []
  const accounts = useAccounts() ?? []
  const accountTypes = useAccountTypes() ?? []

  const selectedAccount = accounts.find((a) => a.id === accountId)
  const selectedType = accountTypes.find((t) => t.id === selectedAccount?.typeId)
  const isLoanType = selectedType?.isLoan ?? false

  function getTotalAmount(): number {
    if (isLoanType && principalAmount && interestAmount) {
      return Number(principalAmount) + Number(interestAmount)
    }
    return Number(amount) || 0
  }

  function isFormValid(): boolean {
    const total = getTotalAmount()
    if (!total) return false
    if (type === 'transfer') return !!accountId && !!transferToAccountId && accountId !== transferToAccountId
    return !!categoryId && !!accountId
  }

  async function handleSubmit() {
    const total = getTotalAmount()
    if (!total || !isFormValid() || !!placeError) return
    setSaving(true)

    if (type === 'transfer') {
      await addTransaction({
        amount: total,
        description: description.trim(),
        accountId: accountId!,
        familyMemberId: selectedAccount!.familyMemberId,
        date: new Date(date),
        type: 'transfer',
        transferToAccountId: transferToAccountId!,
      })
      await updateAccount(accountId!, { balance: selectedAccount!.balance - total })
      const toAccount = accounts.find((a) => a.id === transferToAccountId)!
      await updateAccount(transferToAccountId!, { balance: toAccount.balance + total })
    } else {
      const txData = {
        amount: total,
        description: description.trim(),
        categoryId: categoryId!,
        accountId: accountId!,
        familyMemberId: selectedAccount!.familyMemberId,
        date: new Date(date),
        type,
        principalAmount: isLoanType ? (Number(principalAmount) || null) : null,
        interestAmount: isLoanType ? (Number(interestAmount) || null) : null,
      }

      await addTransaction(txData)
      if (type === 'income') {
        await updateAccount(accountId!, { balance: selectedAccount!.balance + total })
      } else if (isLoanType && Number(principalAmount)) {
        await updateAccount(accountId!, { balance: selectedAccount!.balance - Number(principalAmount) })
      } else {
        await updateAccount(accountId!, { balance: selectedAccount!.balance - total })
      }
    }

    setAmount('')
    setCategoryId(null)
    setAccountId(null)
    setTransferToAccountId(null)
    setDescription('')
    setPrincipalAmount('')
    setInterestAmount('')
    setSaving(false)
    navigate('/')
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'expense', label: '💰 Расход' },
    { key: 'income', label: '📈 Доход' },
    { key: 'transfer', label: '🔄 Перевод' },
  ]

  return (
    <div>
      <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setType(key); setCategoryId(null); setTransferToAccountId(null) }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              type === key ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-2xl">₽</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-4xl font-bold text-right py-4 px-4 outline-none"
          />
        </div>
      </div>

      {type !== 'transfer' && (
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2 font-medium">Категория</div>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id!)}
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
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm mb-4 space-y-3">
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
          value={accountId ?? ''}
          onChange={(e) => {
            setAccountId(Number(e.target.value) || null)
            setPrincipalAmount('')
            setInterestAmount('')
          }}
        >
          <option value="">{type === 'transfer' ? 'Откуда' : 'Выберите счёт...'}</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.icon} {a.name} — {formatCurrency(a.balance)}
            </option>
          ))}
        </select>

        {type === 'transfer' && (
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            value={transferToAccountId ?? ''}
            onChange={(e) => setTransferToAccountId(Number(e.target.value) || null)}
          >
            <option value="">Куда</option>
            {accounts
              .filter((a) => a.id !== accountId)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.name} — {formatCurrency(a.balance)}
                </option>
              ))}
          </select>
        )}

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
        />

        <input
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
        />

        {type !== 'transfer' && (
          <>
            <div className="relative">
              <input
                placeholder="Место покупки"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                { place.length }/30
              </span>
            </div>
            {placeError && (
              <p className="text-red-500 text-xs mt-1">{ placeError }</p>
            )}
          </>
        )}

        {isLoanType && (
          <div className="bg-orange-50 rounded-lg p-3 space-y-2">
            <div className="text-xs text-orange-600 font-medium">Платеж по кредиту</div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Тело кредита"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                className="flex-1 border border-orange-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Проценты"
                value={interestAmount}
                onChange={(e) => setInterestAmount(e.target.value)}
                className="flex-1 border border-orange-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="text-xs text-orange-500 text-right">
              Итого: {formatCurrency(Number(principalAmount) + Number(interestAmount))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving || !getTotalAmount() || !isFormValid() || !!placeError}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-50"
      >
        {saving
          ? 'Сохранение...'
          : type === 'transfer'
            ? 'Перевести'
            : type === 'expense'
              ? 'Записать расход'
              : 'Записать доход'}
      </button>
    </div>
  )
}