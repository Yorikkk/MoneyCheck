import { useState } from 'react'
import { useDebts, useDebtPayments, useFamilyMembers } from '@/hooks/useDb'
import { addDebt, addDebtPayment, updateDebt } from '@/db'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Debt } from '@/db'

export default function DebtsPage() {
  const [tab, setTab] = useState<'active' | 'closed'>('active')
  const debts = useDebts(tab) ?? []
  const familyMembers = useFamilyMembers() ?? []
  const [addForm, setAddForm] = useState(false)
  const [payForm, setPayForm] = useState<{ debtId: number } | null>(null)

  const totalLent = debts.filter((d) => d.type === 'lent').reduce((s, d) => s + d.amount, 0)
  const totalBorrowed = debts.filter((d) => d.type === 'borrowed').reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Долги</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 rounded-xl p-3 shadow-sm">
          <div className="text-xs text-green-600 font-medium">Мне должны</div>
          <div className="text-lg font-bold text-green-700">{formatCurrency(totalLent)}</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 shadow-sm">
          <div className="text-xs text-red-600 font-medium">Я должен</div>
          <div className="text-lg font-bold text-red-700">{formatCurrency(totalBorrowed)}</div>
        </div>
      </div>

      <div className="flex bg-gray-100 rounded-lg p-1">
        {(['active', 'closed'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-md ${tab === t ? 'bg-white shadow-sm' : 'text-gray-500'}`}
          >
            {t === 'active' ? 'Активные' : 'Закрытые'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {debts.map((d) => (
          <DebtCard key={d.id} debt={d} onPay={() => setPayForm({ debtId: d.id! })} onClose={() => updateDebt(d.id!, { status: 'closed', closedAt: new Date() })} />
        ))}
        {debts.length === 0 && <div className="text-center py-6 text-gray-400 text-sm">Нет долгов</div>}
      </div>

      <button onClick={() => setAddForm(true)} className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm">
        ＋ Добавить долг
      </button>

      {addForm && (
        <DebtForm
          familyMembers={familyMembers}
          onSave={async (data) => {
            await addDebt(data)
            setAddForm(false)
          }}
          onCancel={() => setAddForm(false)}
        />
      )}

      {payForm && (
        <PaymentForm
          debtId={payForm.debtId}
          onSave={async (data) => {
            await addDebtPayment(data)
            setPayForm(null)
          }}
          onCancel={() => setPayForm(null)}
        />
      )}
    </div>
  )
}

function DebtCard({ debt, onPay, onClose }: { debt: Debt; onPay: () => void; onClose: () => void }) {
  const payments = useDebtPayments(debt.id!) ?? []
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const progress = debt.amount > 0 ? Math.min(totalPaid / debt.amount, 1) : 0

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-semibold">{debt.personName}</div>
          <div className="text-xs text-gray-500">{debt.description}</div>
        </div>
        <div className="text-right">
          <div className={`font-bold ${debt.type === 'lent' ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(debt.amount)}
          </div>
          {debt.interestRate > 0 && (
            <div className="text-xs text-orange-500">{debt.interestRate}% годовых</div>
          )}
        </div>
      </div>

      <div className="bg-gray-100 rounded-full h-1.5 mb-2">
        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>Выплачено: {formatCurrency(totalPaid)}</span>
        <span>До {formatDate(debt.dueDate)}</span>
      </div>

      <div className="flex gap-2">
        <button onClick={onPay} className="flex-1 py-1.5 text-sm rounded-lg bg-blue-600 text-white">➕ Платёж</button>
        {debt.status === 'active' && (
          <button onClick={onClose} className="flex-1 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600">Закрыть</button>
        )}
      </div>

      {payments.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-gray-400 cursor-pointer">История платежей ({payments.length})</summary>
          <div className="mt-1 space-y-1">
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between text-xs text-gray-500">
                <span>{formatDate(p.date)}{p.note ? ` — ${p.note}` : ''}</span>
                <span className="font-medium">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function DebtForm({
  familyMembers, onSave, onCancel,
}: {
  familyMembers: any[]
  onSave: (data: Omit<Debt, 'id' | 'createdAt'>) => Promise<void>
  onCancel: () => void
}) {
  const [type, setType] = useState<'lent' | 'borrowed'>('lent')
  const [personName, setPersonName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!personName.trim() || !Number(amount)) return
    setSaving(true)
    await onSave({
      type,
      personName: personName.trim(),
      description: description.trim(),
      amount: Number(amount),
      interestRate: Number(interestRate) || 0,
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      status: 'active',
      familyMemberId: familyMembers[0]?.id ?? 0,
    })
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
      <h3 className="font-semibold">Новый долг</h3>
      <div className="flex bg-gray-100 rounded-lg p-1">
        {(['lent', 'borrowed'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 py-1.5 text-sm rounded-md ${type === t ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}
          >
            {t === 'lent' ? 'Я дал' : 'Я взял'}
          </button>
        ))}
      </div>
      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Кому / от кого" value={personName} onChange={(e) => setPersonName(e.target.value)} />
      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Описание" value={description} onChange={(e) => setDescription(e.target.value)} />
      <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Сумма" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Процентная ставка (0 если без %)" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
      <div className="flex gap-2">
        <input type="date" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Дата возврата" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm">Отмена</button>
        <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm">{saving ? '...' : 'Сохранить'}</button>
      </div>
    </div>
  )
}

function PaymentForm({
  debtId, onSave, onCancel,
}: {
  debtId: number
  onSave: (data: Omit<import('@/db').DebtPayment, 'id' | 'createdAt'>) => Promise<void>
  onCancel: () => void
}) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!Number(amount)) return
    setSaving(true)
    await onSave({ debtId, amount: Number(amount), date: new Date(date), note: note.trim() || undefined })
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
      <h3 className="font-semibold">Новый платёж</h3>
      <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Сумма" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Примечание" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm">Отмена</button>
        <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm">{saving ? '...' : 'Записать'}</button>
      </div>
    </div>
  )
}