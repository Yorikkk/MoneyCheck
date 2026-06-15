import { useState } from 'react'
import { useFamilyMembers } from '@/hooks/useDb'
import { addFamilyMember, updateFamilyMember, deleteFamilyMember } from '@/db'
import type { FamilyMember } from '@/db'
import { ColorPicker } from '@/components/ui/ColorPicker'

export default function FamilyMembersManager({ onBack }: { onBack: () => void }) {
  const members = useFamilyMembers() ?? []
  const [edit, setEdit] = useState<Partial<FamilyMember> | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!edit || !edit.name?.trim()) return
    setSaving(true)
    if (edit.id) {
      await updateFamilyMember(edit.id, { name: edit.name.trim(), color: edit.color })
    } else {
      await addFamilyMember({ name: edit.name.trim(), color: edit.color })
    }
    setEdit(null)
    setSaving(false)
  }

  async function handleDelete(id: number) {
    await deleteFamilyMember(id)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-blue-600 text-lg">←</button>
        <h2 className="text-xl font-bold">Члены семьи</h2>
      </div>

      {edit && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4 space-y-3">
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Имя"
            value={edit.name || ''}
            onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            autoFocus
          />
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
        {members.map((m) => (
          <div key={m.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: m.color || '#2196F3' }}>
              {m.name[0]}
            </div>
            <span className="flex-1 font-medium">{m.name}</span>
            <button onClick={() => setEdit(m)} className="text-gray-400 text-sm px-2">✏️</button>
            <button onClick={() => m.id && handleDelete(m.id)} className="text-gray-400 text-sm px-2">🗑️</button>
          </div>
        ))}
      </div>

      <button onClick={() => setEdit({ name: '', color: '#2196F3' })} className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm">
        ＋ Добавить члена семьи
      </button>
    </div>
  )
}