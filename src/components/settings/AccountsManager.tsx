import { useState, useCallback } from 'react'
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { useAccounts, useAccountTypes, useFamilyMembers, useBanks } from '@/hooks/useDb'
import { addAccount, updateAccount, deleteAccount, reorderAccounts } from '@/db'
import type { Account } from '@/db'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import { formatCurrency } from '@/lib/utils'
import AccountCashbacksManager from './AccountCashbacksManager'

const CURRENCIES = ['RUB', 'USD', 'EUR', 'CNY', 'KZT', 'UZS', 'GBP', 'TRY']

function SortableAccount({
  account,
  onEdit,
  onDelete,
  onClick,
  getTypeName,
  getMemberName,
  getBankName,
}: {
  account: Account
  onEdit: () => void
  onDelete: () => void
  onClick: () => void
  getTypeName: (id: number) => string
  getMemberName: (id: number) => string
  getBankName: (id: number) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: account.id! })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: (isDragging ? 'relative' : undefined) as React.CSSProperties['position'],
  }

  return (
    <div ref={setNodeRef} style={style} onClick={onClick} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 cursor-pointer active:bg-gray-50">
      <button {...attributes} {...listeners} onClick={(e) => e.stopPropagation()} className="text-gray-300 cursor-grab active:cursor-grabbing text-lg px-1 touch-none">⠿</button>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shrink-0" style={{ backgroundColor: account.color }}>
        {account.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{account.name}</div>
        <div className="text-xs text-gray-500">{getBankName(account.bankId)} · {getTypeName(account.typeId)} · {getMemberName(account.familyMemberId)}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-semibold text-sm">{formatCurrency(account.balance)}</div>
        <div className="text-xs text-gray-400">{account.currency}</div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onEdit() }} className="text-gray-400 text-sm px-1">✏️</button>
      <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="text-gray-400 text-sm px-1">🗑️</button>
    </div>
  )
}

export default function AccountsManager({ onBack }: { onBack: () => void }) {
  const accounts = useAccounts() ?? []
  const accountTypes = useAccountTypes() ?? []
  const familyMembers = useFamilyMembers() ?? []
  const banks = useBanks() ?? []
  const [edit, setEdit] = useState<Partial<Account> | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  async function handleSave() {
    if (!edit || !edit.name?.trim() || !edit.typeId || !edit.bankId) return
    setSaving(true)
    setError('')
    try {
      if (edit.id) {
        await updateAccount(edit.id, {
          name: edit.name.trim(),
          typeId: edit.typeId,
          bankId: edit.bankId,
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
          bankId: edit.bankId,
          currency: edit.currency || 'RUB',
          balance: edit.balance ?? 0,
          icon: edit.icon || '🏦',
          color: edit.color || '#2196F3',
          familyMemberId: edit.familyMemberId || (familyMembers[0]?.id ?? 0),
          order: accounts.length,
        })
      }
      setEdit(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Вы уверены, что хотите удалить счёт?')) return
    setError('')
    try {
      await deleteAccount(id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  function getTypeName(typeId: number) {
    return accountTypes.find((t) => t.id === typeId)?.name || '—'
  }

  function getMemberName(memberId: number) {
    return familyMembers.find((m) => m.id === memberId)?.name || '—'
  }

  function getBankName(bankId: number) {
    const bank = banks.find((b) => b.id === bankId)
    return bank ? `${bank.icon} ${bank.name}` : '—'
  }

  function getBank(bankId: number) {
    return banks.find((b) => b.id === bankId)
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = accounts.findIndex((a) => a.id === active.id)
    const newIndex = accounts.findIndex((a) => a.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...accounts]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    await reorderAccounts(reordered.map((a) => a.id!))
  }, [accounts])

  return (
    <div>
      {selectedAccount ? (
        <AccountCashbacksManager
          account={selectedAccount}
          bankName={getBank(selectedAccount.bankId)?.name ?? ''}
          bankIcon={getBank(selectedAccount.bankId)?.icon ?? ''}
          onBack={() => setSelectedAccount(null)}
        />
      ) : (
        <>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-blue-600 text-lg">←</button>
        <h2 className="text-xl font-bold">Счета</h2>
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
            placeholder="Название счёта"
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
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={edit.bankId || ''}
            onChange={(e) => setEdit({ ...edit, bankId: Number(e.target.value) })}
          >
            <option value="">Банк...</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
            ))}
          </select>
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

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={accounts.map((a) => a.id!)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {accounts.map((a) => (
              <SortableAccount
                key={a.id}
                account={a}
                onClick={() => setSelectedAccount(a)}
                onEdit={() => setEdit(a)}
                onDelete={() => a.id && handleDelete(a.id)}
                getTypeName={getTypeName}
                getMemberName={getMemberName}
                getBankName={getBankName}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button onClick={() => setEdit({ name: '', icon: '🏦', color: '#2196F3', currency: 'RUB', balance: 0, bankId: banks[0]?.id, familyMemberId: familyMembers[0]?.id })} className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm">
        ＋ Добавить счёт
      </button>
        </>
      )}
    </div>
  )
}