import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { useAccountCashbacks, useCashbacks, useAllCategories } from '@/hooks/useDb'
import { addAccountCashback, updateAccountCashback, deleteAccountCashback } from '@/db'
import { formatPeriod } from '@/lib/utils'
import type { Account, Cashback, AccountCashback, Category } from '@/db'

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

interface Props {
  account: Account
  bankName: string
  bankIcon: string
  onBack: () => void
}

function getInitialDates() {
  const now = dayjs()
  const start = now.startOf('month').toDate()
  const end = now.endOf('month').toDate()
  return { startDate: start, endDate: end }
}

export default function AccountCashbacksManager({ account, bankName, bankIcon, onBack }: Props) {
  const accountCashbacks = useAccountCashbacks(account.id!) ?? []
  const bankCashbacks = useCashbacks(account.bankId) ?? []
  const allCategories = useAllCategories() ?? []

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [cashbackId, setCashbackId] = useState<number | ''>('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [percent, setPercent] = useState(0)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const now = dayjs()
  const [month, setMonth] = useState(now.month())
  const [year, setYear] = useState(now.year())

  const bankCashbackMap: Record<number, Cashback> = {}
  for (const cb of bankCashbacks) {
    bankCashbackMap[cb.id!] = cb
  }

  const groupedCategories = useMemo(() => {
    const roots: Category[] = []
    const children: Record<number, Category[]> = {}
    for (const c of allCategories) {
      if (!c.parentId) {
        roots.push(c)
      } else {
        if (!children[c.parentId]) children[c.parentId] = []
        children[c.parentId].push(c)
      }
    }
    return { roots, children }
  }, [allCategories])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else { setMonth(month - 1) }
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else { setMonth(month + 1) }
  }

  const filteredCashbacks = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59)
    return accountCashbacks.filter((ac) => {
      const start = new Date(ac.startDate)
      const end = new Date(ac.endDate)
      return start <= lastDay && end >= firstDay
    })
  }, [accountCashbacks, month, year])

  function resetForm() {
    setShowForm(false)
    setEditId(null)
    setCashbackId('')
    setCategoryId('')
    setPercent(0)
    setStartDate('')
    setEndDate('')
  }

  function initAdd() {
    const dates = getInitialDates()
    setEditId(null)
    setCashbackId('')
    setCategoryId('')
    setPercent(0)
    setStartDate(dayjs(dates.startDate).format('YYYY-MM-DD'))
    setEndDate(dayjs(dates.endDate).format('YYYY-MM-DD'))
    setShowForm(true)
  }

  function initEdit(ac: AccountCashback) {
    setEditId(ac.id!)
    setCashbackId(ac.cashbackId)
    setCategoryId(ac.categoryId ?? '')
    setPercent(ac.percent)
    setStartDate(dayjs(ac.startDate).format('YYYY-MM-DD'))
    setEndDate(dayjs(ac.endDate).format('YYYY-MM-DD'))
    setShowForm(true)
  }

  async function handleSave() {
    if (!cashbackId || !startDate || !endDate) return
    setSaving(true)
    setError('')
    try {
      const data = {
        accountId: account.id!,
        cashbackId: cashbackId as number,
        categoryId: categoryId || undefined,
        percent,
        startDate: dayjs(startDate).startOf('day').toDate(),
        endDate: dayjs(endDate).endOf('day').toDate(),
      }
      if (editId) {
        await updateAccountCashback(editId, data)
      } else {
        await addAccountCashback(data)
      }
      resetForm()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Вы уверены, что хотите удалить этот кешбек?')) return
    setError('')
    try {
      await deleteAccountCashback(id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  function getCategoryName(categoryId?: number | null): string {
    if (!categoryId) return ''
    const cat = allCategories.find((c) => c.id === categoryId)
    return cat?.name ?? ''
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-blue-600 text-lg">←</button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shrink-0" style={{ backgroundColor: account.color }}>
          {account.icon}
        </div>
        <h2 className="text-xl font-bold truncate">{account.name}</h2>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        {bankIcon} {bankName}
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm mb-4">
        <button onClick={prevMonth} className="text-blue-600 text-lg px-2">◀</button>
        <span className="font-semibold">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="text-blue-600 text-lg px-2">▶</button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4 space-y-3">
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={cashbackId}
            onChange={(e) => setCashbackId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Выберите кешбек...</option>
            {bankCashbacks.map((cb) => (
              <option key={cb.id} value={cb.id}>
                {cb.name}
              </option>
            ))}
          </select>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Категория (необязательно)</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">— Без категории —</option>
              {groupedCategories.roots.map((root) => (
                <optgroup key={root.id} label={root.name}>
                  <option value={root.id}>{root.name}</option>
                  {(groupedCategories.children[root.id!] ?? []).map((child) => (
                    <option key={child.id} value={child.id}>
                      &nbsp;&nbsp;└ {child.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Процент</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="0.00"
              value={percent}
              onChange={(e) => setPercent(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm text-gray-500 mb-1 block">Начало</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-gray-500 mb-1 block">Конец</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={resetForm} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm">Отмена</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm">
              {saving ? '...' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filteredCashbacks.length === 0 && !showForm && (
          <div className="text-center text-gray-400 py-8 text-sm">
            Нет кешбеков за этот месяц. Нажмите "＋ Добавить кешбек", чтобы добавить.
          </div>
        )}
        {filteredCashbacks.map((ac) => {
          const cb = bankCashbackMap[ac.cashbackId]
          return (
            <div key={ac.id} className="bg-white rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{cb?.name ?? '—'}</div>
                  <div className="text-sm text-gray-500">
                    {ac.percent}%
                    {ac.categoryId && <> · {getCategoryName(ac.categoryId)}</>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {formatPeriod(ac.startDate, ac.endDate)}
                  </div>
                  {cb?.mccList && cb.mccList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cb.mccList.map((mcc) => (
                        <span key={mcc} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                          {mcc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => initEdit(ac)} className="text-gray-400 text-sm px-2">✏️</button>
                  <button onClick={() => ac.id && handleDelete(ac.id)} className="text-gray-400 text-sm px-2">🗑️</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {bankCashbacks.length > 0 && (
        <button
          onClick={initAdd}
          className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm"
        >
          ＋ Добавить кешбек
        </button>
      )}
    </div>
  )
}