import { useState } from 'react'
import { useCategories } from '@/hooks/useDb'
import { addCategory, updateCategory, deleteCategory } from '@/db'
import type { Category } from '@/db'
import { ColorPicker } from '@/components/ui/ColorPicker'

export default function CategoriesManager({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'expense' | 'income'>('expense')
  const categories = useCategories(tab) ?? []
  const [edit, setEdit] = useState<Partial<Category> | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!edit || !edit.name?.trim()) return
    setSaving(true)
    if (edit.id) {
      await updateCategory(edit.id, { name: edit.name.trim(), icon: edit.icon || '📦', color: edit.color || '#9E9E9E', type: tab, order: edit.order ?? 99 })
    } else {
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.order), 0)
      await addCategory({ name: edit.name.trim(), icon: edit.icon || '📦', color: edit.color || '#9E9E9E', type: tab, order: maxOrder + 1 })
    }
    setEdit(null)
    setSaving(false)
  }

  async function handleDelete(id: number) {
    await deleteCategory(id)
  }

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'expense', label: 'Расходы' },
    { key: 'income', label: 'Доходы' },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-blue-600 text-lg">←</button>
        <h2 className="text-xl font-bold">Категории</h2>
      </div>

      <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setEdit(null) }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {edit && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4 space-y-3">
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Название"
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
            value={edit.color || '#9E9E9E'}
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
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
            <span className="text-2xl">{c.icon}</span>
            <span className="flex-1 font-medium">{c.name}</span>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
            <button onClick={() => setEdit(c)} className="text-gray-400 text-sm px-2">✏️</button>
            <button onClick={() => c.id && handleDelete(c.id)} className="text-gray-400 text-sm px-2">🗑️</button>
          </div>
        ))}
      </div>

      <button onClick={() => setEdit({ name: '', icon: '📦', color: '#9E9E9E' })} className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm">
        ＋ Добавить категорию
      </button>
    </div>
  )
}