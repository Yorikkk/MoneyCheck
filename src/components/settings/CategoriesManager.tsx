import { useState } from 'react'
import {
  DndContext, DragEndEvent, closestCenter,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRootCategories, useSubcategories, useHasSubcategories } from '@/hooks/useDb'
import { addCategory, updateCategory, deleteCategory, reorderCategories } from '@/db'
import type { Category } from '@/db'
import { ColorPicker } from '@/components/ui/ColorPicker'

export default function CategoriesManager({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'expense' | 'income'>('expense')
  const rootCategories = useRootCategories(tab) ?? []
  const [edit, setEdit] = useState<Partial<Category> | null>(null)
  const [saving, setSaving] = useState(false)
  const [parent, setParent] = useState<Category | null>(null)

  const subcategories = useSubcategories(parent?.id ?? 0)
  const categories = parent ? (subcategories ?? []) : rootCategories

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex(c => c.id === active.id)
    const newIndex = categories.findIndex(c => c.id === over.id)
    const reordered = arrayMove(categories, oldIndex, newIndex)
    reorderCategories(reordered.map(c => c.id!))
  }

  async function handleSave() {
    if (!edit || !edit.name?.trim()) return
    setSaving(true)
    if (edit.id) {
      const changes: Partial<Category> = {
        name: edit.name.trim(),
        icon: edit.icon || '📦',
        color: edit.color || '#9E9E9E',
        mcc: edit.mcc || undefined,
      }
      if (edit.parentId !== undefined) {
        changes.parentId = edit.parentId
      }
      await updateCategory(edit.id, changes)
    } else {
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.order), 0)
      await addCategory({
        name: edit.name.trim(),
        icon: edit.icon || '📦',
        color: edit.color || '#9E9E9E',
        type: tab,
        order: maxOrder + 1,
        parentId: parent?.id ?? undefined,
        mcc: edit.mcc || undefined,
      })
    }
    setEdit(null)
    setSaving(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить категорию? Все подкатегории также будут удалены.')) return
    await deleteCategory(id)
    if (parent && parent.id === id) {
      setParent(null)
    }
  }

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'expense', label: 'Расходы' },
    { key: 'income', label: 'Доходы' },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {parent ? (
          <button onClick={() => { setParent(null); setEdit(null) }} className="text-blue-600 text-lg">←</button>
        ) : (
          <button onClick={onBack} className="text-blue-600 text-lg">←</button>
        )}
        <h2 className="text-xl font-bold">
          {parent ? `${parent.icon} ${parent.name}` : 'Категории'}
        </h2>
      </div>

      {!parent && (
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setEdit(null); setParent(null) }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {edit && (
        <CategoryEditForm
          edit={edit}
          saving={saving}
          onSave={handleSave}
          onCancel={() => setEdit(null)}
          onChange={setEdit}
        />
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map(c => c.id!)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {categories.map((c) => (
              <SortableCategoryCard
                key={c.id}
                category={c}
                onEdit={() => setEdit(c)}
                onDelete={() => c.id && handleDelete(c.id)}
                onEnter={() => setParent(c)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={() => setEdit({ name: '', icon: '📦', color: '#9E9E9E', parentId: parent?.id })}
        className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm"
      >
        ＋ Добавить {parent ? 'подкатегорию' : 'категорию'}
      </button>
    </div>
  )
}

function SortableCategoryCard({ category, onEdit, onDelete, onEnter }: {
  category: Category
  onEdit: () => void
  onDelete: () => void
  onEnter: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id! })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <CategoryCard
        category={category}
        onEdit={onEdit}
        onDelete={onDelete}
        onEnter={onEnter}
        dragListeners={listeners}
      />
    </div>
  )
}

function CategoryCard({ category, onEdit, onDelete, onEnter, dragListeners, dragHandleRef }: {
  category: Category
  onEdit: () => void
  onDelete: () => void
  onEnter: () => void
  dragListeners?: Record<string, Function>
  dragHandleRef?: (el: HTMLButtonElement | null) => void
}) {
  const hasSubs = useHasSubcategories(category.id!)
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
      <button ref={dragHandleRef} {...dragListeners} className="cursor-grab text-gray-400 text-sm touch-none px-1">⠿</button>
      <span className="text-2xl">{category.icon}</span>
      <button
        onClick={onEnter}
        className="flex-1 font-medium text-left"
      >
        {category.name}
      </button>
      {category.mcc && (
        <span className="text-xs text-gray-400 font-mono">MCC {category.mcc}</span>
      )}
      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
      <button onClick={onEdit} className="text-gray-400 text-sm px-1">✏️</button>
      <button onClick={onDelete} className="text-gray-400 text-sm px-1">🗑️</button>
      {hasSubs && (
        <button onClick={onEnter} className="text-gray-400 text-sm px-1">▶</button>
      )}
    </div>
  )
}

function CategoryEditForm({ edit, saving, onSave, onCancel, onChange }: {
  edit: Partial<Category>
  saving: boolean
  onSave: () => void
  onCancel: () => void
  onChange: (e: Partial<Category>) => void
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm mb-4 space-y-3">
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder="Название"
        value={edit.name || ''}
        onChange={(e) => onChange({ ...edit, name: e.target.value })}
        autoFocus
      />
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder="Иконка (emoji)"
        value={edit.icon || ''}
        onChange={(e) => onChange({ ...edit, icon: e.target.value })}
        maxLength={2}
      />
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder="MCC-код (4 цифры)"
        type="number"
        value={edit.mcc ?? ''}
        onChange={(e) => onChange({ ...edit, mcc: e.target.value ? Number(e.target.value) : undefined })}
      />
      <ColorPicker
        value={edit.color || '#9E9E9E'}
        onChange={(c) => onChange({ ...edit, color: c })}
      />
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm">Отмена</button>
        <button onClick={onSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm">
          {saving ? '...' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}