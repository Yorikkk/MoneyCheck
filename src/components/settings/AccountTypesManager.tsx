import { useState } from 'react'
import { useAccountTypes } from '@/hooks/useDb'
import { addAccountType, updateAccountType, deleteAccountType } from '@/db'
import type { AccountType } from '@/db'
import { ColorPicker } from '@/components/ui/ColorPicker'

export default function AccountTypesManager({ onBack }: { onBack: () => void }) {
  const types = useAccountTypes() ?? []
  const [edit, setEdit] = useState<Partial<AccountType> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!edit || !edit.name?.trim()) return
    setSaving(true)
    if (edit.id) {
      await updateAccountType(edit.id, { name: edit.name.trim(), icon: edit.icon || '💳', color: edit.color || '#2196F3', kind: edit.kind ?? 'regular', order: edit.order ?? 99 })
    } else {
      const maxOrder = types.reduce((m, t) => Math.max(m, t.order), 0)
      await addAccountType({ name: edit.name.trim(), icon: edit.icon || '💳', color: edit.color || '#2196F3', kind: edit.kind ?? 'regular', order: maxOrder + 1 })
    }
    setEdit(null)
    setSaving(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('Вы уверены, что хотите удалить этот тип счёта?')) return
    setError('')
    try {
      await deleteAccountType(id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-blue-600 text-lg">←</button>
        <h2 className="text-xl font-bold">Типы счетов</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {edit && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4 space-y-3">
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Название типа"
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
            value={edit.kind ?? 'regular'}
            onChange={(e) => setEdit({ ...edit, kind: e.target.value as 'regular' | 'credit' | 'mortgage' })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="regular">Обычный счёт</option>
            <option value="credit">Кредитный счёт</option>
            <option value="mortgage">Ипотека</option>
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
        {types.map((t) => (
          <div key={t.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
            <span className="text-2xl">{t.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="font-medium">{t.name}</span>
              {t.kind === 'credit' && <span className="text-xs text-gray-400 ml-2">📉 кредит</span>}
              {t.kind === 'mortgage' && <span className="text-xs text-gray-400 ml-2">🏠 ипотека</span>}
            </div>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />
            <button onClick={() => setEdit(t)} className="text-gray-400 text-sm px-2">✏️</button>
            <button onClick={() => t.id && handleDelete(t.id)} className="text-gray-400 text-sm px-2">🗑️</button>
          </div>
        ))}
      </div>

      <button onClick={() => setEdit({ name: '', icon: '💳', color: '#2196F3', kind: 'regular' })} className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm">
        ＋ Добавить тип счета
      </button>
    </div>
  )
}