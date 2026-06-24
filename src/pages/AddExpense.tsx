import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import dayjs from 'dayjs'
import { useRootCategories, useSubcategories, useAccounts, useAccountTypes, useBanks } from '@/hooks/useDb'
import { addTransaction, updateTransaction, updateAccount, hasSubcategories } from '@/db'
import type { Transaction, Category } from '@/db'
import { formatCurrency } from '@/lib/utils'

type Tab = 'expense' | 'income' | 'transfer'

function getSourceEffect(kind: string | undefined, type: string, amount: number): number {
  if (kind === 'credit') {
    return type === 'income' ? -amount : amount
  }
  return type === 'income' ? amount : -amount
}

function getDestEffect(kind: string | undefined, amount: number, principalAmount: number | null): number {
  if (kind === 'mortgage' && principalAmount) {
    return -principalAmount
  }
  if (kind === 'credit') {
    return -amount
  }
  return amount
}

export default function AddExpense() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as { accountId?: number; editTx?: Transaction } | null

  const isEditing = !!locationState?.editTx

  const [type, setType] = useState<Tab>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [accountId, setAccountId] = useState<number | null>(locationState?.accountId ?? null)
  const [transferToAccountId, setTransferToAccountId] = useState<number | null>(null)
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [description, setDescription] = useState('')
  const [principalAmount, setPrincipalAmount] = useState('')
  const [interestAmount, setInterestAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [place, setPlace] = useState('')
  const [mcc, setMcc] = useState('')
  const [browseParent, setBrowseParent] = useState<Category | null>(null)

  useEffect(() => {
    if (locationState?.editTx) {
      const tx = locationState.editTx
      setType(tx.type)
      setAmount(String(tx.amount))
      setCategoryId(tx.categoryId ?? null)
      setAccountId(tx.accountId)
      setTransferToAccountId(tx.transferToAccountId ?? null)
      setDate(dayjs(tx.date).format('YYYY-MM-DD'))
      setDescription(tx.description)
      setPrincipalAmount(tx.principalAmount ? String(tx.principalAmount) : '')
      setInterestAmount(tx.interestAmount ? String(tx.interestAmount) : '')
      setMcc(tx.mcc ? String(tx.mcc) : '')
      setBrowseParent(null)
    } else if (locationState?.accountId) {
      setAccountId(locationState.accountId)
    }
  }, [locationState])

  const placeError = place.length > 30 ? 'Максимум 30 символов' : ''

  const rootCategories = useRootCategories(type === 'transfer' ? undefined : type) ?? []
  const subCategories = useSubcategories(browseParent?.id ?? null) ?? []
  const categories = browseParent ? subCategories : rootCategories

  const selectedCategory = (browseParent ? subCategories : rootCategories).find((c) => c.id === categoryId)
  const accounts = useAccounts() ?? []
  const accountTypes = useAccountTypes() ?? []
  const banks = useBanks() ?? []

  const typeKindMap: Record<number, string> = {}
  for (const t of accountTypes) {
    if (t.id != null) typeKindMap[t.id] = t.kind
  }

  function getBankLabel(bankId: number) {
    const bank = banks.find((b) => b.id === bankId)
    return bank ? bank.name : ''
  }

  const selectedAccount = accounts.find((a) => a.id === accountId)
  const selectedType = accountTypes.find((t) => t.id === selectedAccount?.typeId)

  const selectedDestAccount = type === 'transfer' ? accounts.find((a) => a.id === transferToAccountId) : undefined
  const selectedDestType = selectedDestAccount ? accountTypes.find((t) => t.id === selectedDestAccount?.typeId) : undefined
  const isDestMortgageType = selectedDestType?.kind === 'mortgage'

  const showLoanFields = type === 'transfer' && isDestMortgageType

  function getTotalAmount(): number {
    if (showLoanFields && principalAmount && interestAmount) {
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

    const oldTx = isEditing ? locationState!.editTx! : null

    if (isEditing && oldTx) {
      if (type === 'transfer') {
        // ---- transfer edit ----
        const oldFromAcc = accounts.find((a) => a.id === oldTx.accountId)
        const newFromAcc = accounts.find((a) => a.id === accountId)
        const oldFromKind = oldFromAcc ? typeKindMap[oldFromAcc.typeId] : undefined
        const newFromKind = newFromAcc ? typeKindMap[newFromAcc.typeId] : undefined

        const newToAcc = accounts.find((a) => a.id === transferToAccountId)
        const newToKind = newToAcc ? typeKindMap[newToAcc.typeId] : undefined

        const oldToAcc = accounts.find((a) => a.id === oldTx.transferToAccountId)
        const oldToKind = oldToAcc ? typeKindMap[oldToAcc.typeId] : undefined

        const oldToEffect = getDestEffect(oldToKind, oldTx.amount, oldTx.principalAmount ?? null)
        const newToEffect = getDestEffect(newToKind, total, Number(principalAmount) || null)

        const oldFromEffect = getSourceEffect(oldFromKind, 'transfer', oldTx.amount)
        const newFromEffect = getSourceEffect(newFromKind, 'transfer', total)

        if (accountId === oldTx.accountId && oldFromAcc) {
          await updateAccount(accountId!, { balance: oldFromAcc.balance - oldFromEffect + newFromEffect })
        } else {
          if (oldFromAcc) await updateAccount(oldTx.accountId, { balance: oldFromAcc.balance - oldFromEffect })
          if (newFromAcc) await updateAccount(accountId!, { balance: newFromAcc.balance + newFromEffect })
        }

        if (transferToAccountId === oldTx.transferToAccountId && oldToAcc) {
          await updateAccount(transferToAccountId!, { balance: oldToAcc.balance - oldToEffect + newToEffect })
        } else {
          if (oldToAcc) await updateAccount(oldTx.transferToAccountId!, { balance: oldToAcc.balance - oldToEffect })
          if (newToAcc) await updateAccount(transferToAccountId!, { balance: newToAcc.balance + newToEffect })
        }

        await updateTransaction(oldTx.id!, {
          amount: total,
          description: description.trim(),
          accountId: accountId!,
          date: new Date(date),
          transferToAccountId: transferToAccountId!,
          principalAmount: isDestMortgageType ? (Number(principalAmount) || null) : null,
          interestAmount: isDestMortgageType ? (Number(interestAmount) || null) : null,
        })
      } else {
        // ---- income / expense edit ----
        const oldAcc = accounts.find((a) => a.id === oldTx.accountId)
        const oldAccKind = oldAcc ? typeKindMap[oldAcc.typeId] : undefined

        const oldEffect = getSourceEffect(oldAccKind, oldTx.type, oldTx.amount)
        const newEffect = getSourceEffect(selectedType?.kind, type, total)

        if (accountId === oldTx.accountId && oldAcc) {
          await updateAccount(accountId!, { balance: oldAcc.balance - oldEffect + newEffect })
        } else {
          if (oldAcc) await updateAccount(oldTx.accountId, { balance: oldAcc.balance - oldEffect })
          if (selectedAccount) await updateAccount(accountId!, { balance: selectedAccount.balance + newEffect })
        }

        await updateTransaction(oldTx.id!, {
          amount: total,
          description: description.trim(),
          categoryId: categoryId!,
          accountId: accountId!,
          date: new Date(date),
          type: type as 'income' | 'expense',
          principalAmount: null,
          interestAmount: null,
          mcc: mcc ? Number(mcc) : undefined,
        })
      }
    } else {
      // ---- add new transaction ----
      if (type === 'transfer') {
        const fromKind = typeKindMap[selectedAccount!.typeId]
        const toKind = typeKindMap[accounts.find((a) => a.id === transferToAccountId)!.typeId]

        await addTransaction({
          amount: total,
          description: description.trim(),
          accountId: accountId!,
          familyMemberId: selectedAccount!.familyMemberId,
          date: new Date(date),
          type: 'transfer',
          transferToAccountId: transferToAccountId!,
          principalAmount: isDestMortgageType ? (Number(principalAmount) || null) : null,
          interestAmount: isDestMortgageType ? (Number(interestAmount) || null) : null,
        })
        await updateAccount(accountId!, { balance: selectedAccount!.balance + getSourceEffect(fromKind, 'transfer', total) })
        const toAccount = accounts.find((a) => a.id === transferToAccountId)!
        if (isDestMortgageType && Number(principalAmount)) {
          await updateAccount(transferToAccountId!, { balance: toAccount.balance - Number(principalAmount) })
        } else {
          await updateAccount(transferToAccountId!, { balance: toAccount.balance + getDestEffect(toKind, total, null) })
        }
      } else {
        await addTransaction({
          amount: total,
          description: description.trim(),
          categoryId: categoryId!,
          accountId: accountId!,
          familyMemberId: selectedAccount!.familyMemberId,
          date: new Date(date),
          type,
          principalAmount: null,
          interestAmount: null,
          mcc: mcc ? Number(mcc) : undefined,
        })
        await updateAccount(accountId!, { balance: selectedAccount!.balance + getSourceEffect(selectedType?.kind, type, total) })
      }
    }

    setAmount('')
    setCategoryId(null)
    setAccountId(null)
    setTransferToAccountId(null)
    setDescription('')
    setPrincipalAmount('')
    setInterestAmount('')
    setMcc('')
    setSaving(false)
    navigate('/transactions')
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
            disabled={isEditing}
            onClick={() => { setType(key); setCategoryId(null); setTransferToAccountId(null); setPrincipalAmount(''); setInterestAmount(''); setMcc(''); setBrowseParent(null) }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              type === key ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-gray-500'
            } ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {type === 'transfer' && isDestMortgageType ? (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
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
              Итого: {formatCurrency((Number(principalAmount) || 0) + (Number(interestAmount) || 0))}
            </div>
          </div>
        </div>
      ) : (
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
      )}

      {type !== 'transfer' && (
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2 font-medium">Категория</div>
          {browseParent && (
            <button
              onClick={() => { setBrowseParent(null); setCategoryId(null); setMcc('') }}
              className="text-sm text-blue-600 mb-2 flex items-center gap-1"
            >
              ← {browseParent.icon} {browseParent.name}
            </button>
          )}
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={async () => {
                  const hasSubs = await hasSubcategories(cat.id!)
                  if (hasSubs) {
                    setBrowseParent(cat)
                    setCategoryId(null)
                  } else {
                    setCategoryId(cat.id!)
                    if (cat.mcc) {
                      setMcc(String(cat.mcc))
                    } else {
                      setMcc('')
                    }
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
            <div className="mt-2">
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

      {type === 'transfer' ? (
        <>
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2 font-medium">Откуда</div>
            <div className="grid grid-cols-4 gap-2">
              {accounts
                .filter((a) => typeKindMap[a.typeId] !== 'mortgage')
                .map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setAccountId(a.id!); setPrincipalAmount(''); setInterestAmount('') }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      accountId === a.id
                        ? 'bg-blue-50 ring-2 ring-blue-500'
                        : 'bg-white shadow-sm'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shrink-0"
                         style={{ backgroundColor: a.color }}>
                      {a.icon}
                    </div>
                    <span className="text-xs truncate w-full text-center">{a.name}</span>
                    <span className="text-[10px] text-gray-400 truncate w-full text-center">{getBankLabel(a.bankId)}</span>
                    <span className="text-[10px] text-gray-400 truncate w-full text-center">{formatCurrency(a.balance)}</span>
                  </button>
                ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2 font-medium">Куда</div>
            <div className="grid grid-cols-4 gap-2">
              {accounts
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setTransferToAccountId(a.id!); setPrincipalAmount(''); setInterestAmount('') }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      transferToAccountId === a.id
                        ? 'bg-blue-50 ring-2 ring-blue-500'
                        : 'bg-white shadow-sm'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shrink-0"
                         style={{ backgroundColor: a.color }}>
                      {a.icon}
                    </div>
                    <span className="text-xs truncate w-full text-center">{a.name}</span>
                    <span className="text-[10px] text-gray-400 truncate w-full text-center">{getBankLabel(a.bankId)}</span>
                    <span className="text-[10px] text-gray-400 truncate w-full text-center">{formatCurrency(a.balance)}</span>
                  </button>
                ))}
            </div>
          </div>
        </>
      ) : (
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2 font-medium">Счёт</div>
          <div className="grid grid-cols-4 gap-2">
            {accounts
              .filter((a) => typeKindMap[a.typeId] !== 'mortgage')
              .map((a) => (
                <button
                  key={a.id}
                  onClick={() => { setAccountId(a.id!); setPrincipalAmount(''); setInterestAmount('') }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    accountId === a.id
                      ? 'bg-blue-50 ring-2 ring-blue-500'
                      : 'bg-white shadow-sm'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shrink-0"
                         style={{ backgroundColor: a.color }}>
                      {a.icon}
                    </div>
                  <span className="text-xs truncate w-full text-center">{a.name}</span>
                  <span className="text-[10px] text-gray-400 truncate w-full text-center">{getBankLabel(a.bankId)}</span>
                  <span className="text-[10px] text-gray-400 truncate w-full text-center">{formatCurrency(a.balance)}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm mb-4 space-y-3">
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
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving || !getTotalAmount() || !isFormValid() || !!placeError}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-50"
      >
        {saving
          ? 'Сохранение...'
          : isEditing
            ? 'Сохранить'
            : type === 'transfer'
              ? 'Перевести'
              : type === 'expense'
                ? 'Записать расход'
                : 'Записать доход'}
      </button>
    </div>
  )
}