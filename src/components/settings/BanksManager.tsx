import { useState } from 'react'
import { useBanks } from '@/hooks/useDb'
import { addBank, updateBank, deleteBank } from '@/db'
import type { Bank } from '@/db'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import CashbacksManager from './CashbacksManager'

export default function BanksManager({ onBack }: { onBack: () => void }) {
  const banks = useBanks() ?? []
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [edit, setEdit] = useState<Partial<Bank> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  async function handleSave() {
    if (!edit || !edit.name?.trim()) return
    setSaving(true)
    setError('')
    if (edit.id) {
      await updateBank(edit.id, { name: edit.name.trim(), icon: edit.icon || '🏦', color: edit.color || '#2196F3', order: edit.order ?? 99 })
    } else {
      const maxOrder = banks.reduce((m, b) => Math.max(m, b.order), 0)
      await addBank({ name: edit.name.trim(), icon: edit.icon || '🏦', color: edit.color || '#2196F3', order: maxOrder + 1 })
    }
    setEdit(null)
    setSaving(false)
  }

  async function handleDelete(id: number) {
    setError('')
    try {
      await deleteBank(id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  if (selectedBank) {
    return (
      <CashbacksManager
        bankId={selectedBank.id!}
        bankName={selectedBank.name}
        bankIcon={selectedBank.icon}
        onBack={() => setSelectedBank(null)}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-blue-600 text-lg">←</button>
        <h2 className="text-xl font-bold">Банки</h2>
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
            placeholder="Название банка"
            value={edit.name || ''}
            onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
          >
            <span className="text-xl">{edit.icon || '🏦'}</span>
            <span className="text-gray-400">Выбрать иконку</span>
          </button>
          {showPicker && (
            <EmojiPicker
              value={edit.icon || ''}
              onChange={(emoji) => setEdit({ ...edit, icon: emoji })}
              onClose={() => setShowPicker(false)}
            />
          )}
          <ColorPicker
            value={edit.color || '#2196F3'}
            onChange={(c) => setEdit({ ...edit, color: c })}
          />
          <div className="flex gap-2">
            <button onClick={() => setEdit(null)} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm">Отмена</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm">
              {saving ? '...' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {banks.map((b) => (
          <div
            key={b.id}
            onClick={() => setSelectedBank(b)}
            className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 cursor-pointer hover:bg-gray-50"
          >
            <span className="text-2xl">{b.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="font-medium">{b.name}</span>
            </div>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: b.color }} />
            <button
              onClick={(e) => { e.stopPropagation(); setEdit(b) }}
              className="text-gray-400 text-sm px-2"
            >
              ✏️
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); b.id && handleDelete(b.id) }}
              className="text-gray-400 text-sm px-2"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <button onClick={() => setEdit({ name: '', icon: '🏦', color: '#2196F3' })} className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm">
        ＋ Добавить банк
      </button>
    </div>
  )
}