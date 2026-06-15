import { useState } from 'react'
import { useAccounts, useAccountTypes, useFamilyMembers } from '@/hooks/useDb'
import { addAccount, updateAccount, deleteAccount } from '@/db'
import type { Account } from '@/db'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { formatCurrency } from '@/lib/utils'

const CURRENCIES = ['RUB', 'USD', 'EUR', 'CNY', 'KZT', 'UZS', 'GBP', 'TRY']

export default function AccountsManager({ onBack }: { onBack: () => void }) {
  const accounts = useAccounts() ?? []
  const accountTypes = useAccountTypes() ?? []
  const familyMembers = useFamilyMembers() ?? []
  const [edit, setEdit] = useState<Partial<Account> | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!edit || !edit.name?.trim() || !edit.typeId) return
    setSaving(true)
    if (edit.id) {
      await updateAccount(edit.id, {
        name: edit.name.trim(),
        typeId: edit.typeId,
        currency: edit.currency || 'RUB',
        balance: edit.balance ?? 0,
        icon: edit.icon || '🏦',
        color: edit.color || '#2196F3',
        familyMemberId: edit.familyMemberId,
      })
    } else {
      await addAccount({
        name: edit.name.trim(),
        typeId: edit.typeId,
        currency: edit.currency || 'RUB',
        balance: edit.balance ?? 0,
        icon: edit.icon || '🏦',
        color: edit.color || '#2196F3',
        familyMemberId: edit.familyMemberId || (familyMembers[0]?.id ?? 0),
      })
    }
    setEdit(null)
    setSaving(false)
  }

  async function handleDelete(id: number) {
    await deleteAccount(id)
  }

  function getTypeName(typeId: number) {
    return accountTypes.find((t) => t.id === typeId)?.name || '—'
  }

  function getMemberName(memberId: number) {
    return familyMembers.find((m) => m.id === memberId)?.name || '—'
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-blue-600 text-lg">←</button>
        <h2 className="text-xl font-bold">Счета</h2>
      </div>

      {edit && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4 space-y-3">
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Название счёта"
            value={edit.name || ''}
            onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            autoFocus
          />
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Иконка (emoji)"
            value={edit.icon || ''}
            onChange={(e) => setEdit({ ...edit, icon: e.target.value })}
            maxLength={2}
          />
          <ColorPicker
            value={edit.color || '#2196F3'}
            onChange={(c) => setEdit({ ...edit, color: c })}
          />
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={edit.typeId || ''}
            onChange={(e) => setEdit({ ...edit, typeId: Number(e.target.value) })}
          >
            <option value="">Тип счёта...</option>
            {accountTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
            ))}
          </select>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={edit.currency || 'RUB'}
            onChange={(e) => setEdit({ ...edit, currency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Остаток"
            value={edit.balance ?? ''}
            onChange={(e) => setEdit({ ...edit, balance: Number(e.target.value) })}
          />
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={edit.familyMemberId || ''}
            onChange={(e) => setEdit({ ...edit, familyMemberId: Number(e.target.value) })}
          >
            <option value="">Владелец...</option>
            {familyMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={() => setEdit(null)} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm">Отмена</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm">
              {saving ? '...' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {accounts.map((a) => (
          <div key={a.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg" style={{ backgroundColor: a.color }}>
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{a.name}</div>
              <div className="text-xs text-gray-500">{getTypeName(a.typeId)} · {getMemberName(a.familyMemberId)}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-sm">{formatCurrency(a.balance)}</div>
              <div className="text-xs text-gray-400">{a.currency}</div>
            </div>
            <button onClick={() => setEdit(a)} className="text-gray-400 text-sm px-1">✏️</button>
            <button onClick={() => a.id && handleDelete(a.id)} className="text-gray-400 text-sm px-1">🗑️</button>
          </div>
        ))}
      </div>

      <button onClick={() => setEdit({ name: '', icon: '🏦', color: '#2196F3', currency: 'RUB', balance: 0, familyMemberId: familyMembers[0]?.id })} className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm">
        ＋ Добавить счёт
      </button>
    </div>
  )
}