import { useState } from 'react'
import { useCashbacks } from '@/hooks/useDb'
import { addCashback, updateCashback, deleteCashback } from '@/db'
import type { Cashback } from '@/db'

interface Props {
  bankId: number
  bankName: string
  bankIcon: string
  onBack: () => void
}

export default function CashbacksManager({ bankId, bankName, bankIcon, onBack }: Props) {
  const cashbacks = useCashbacks(bankId) ?? []

  const [edit, setEdit] = useState<Partial<Cashback> & { mccInputs: string[] } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function initForm(cashback?: Cashback) {
    if (cashback) {
      setEdit({
        ...cashback,
        mccInputs: cashback.mccList?.map(String) ?? [],
      })
    } else {
      setEdit({
        bankId,
        name: '',
        mccList: [],
        mccInputs: [],
      })
    }
  }

  function addMccInput() {
    setEdit((prev) => {
      if (!prev) return prev
      return { ...prev, mccInputs: [...prev.mccInputs, ''] }
    })
  }

  function removeMccInput(index: number) {
    setEdit((prev) => {
      if (!prev) return prev
      const next = [...prev.mccInputs]
      next.splice(index, 1)
      return { ...prev, mccInputs: next }
    })
  }

  function updateMccInput(index: number, value: string) {
    setEdit((prev) => {
      if (!prev) return prev
      const next = [...prev.mccInputs]
      next[index] = value
      return { ...prev, mccInputs: next }
    })
  }

  async function handleSave() {
    if (saving) return
    if (!edit || !edit.name?.trim()) return
    setSaving(true)
    setError('')

    const mccList = edit.mccInputs
      .map((v) => parseInt(v, 10))
      .filter((v) => !isNaN(v) && v > 0)

    const data = {
      bankId,
      name: edit.name.trim(),
      mccList: mccList.length > 0 ? mccList : undefined,
    }

    try {
      if (edit.id) {
        await updateCashback(edit.id, data)
      } else {
        await addCashback(data)
      }
      setEdit(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('Вы уверены, что хотите удалить этот кешбек?')) return
    setError('')
    try {
      await deleteCashback(id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-blue-600 text-lg">←</button>
        <h2 className="text-xl font-bold">
          {bankIcon} {bankName} — Кешбеки
        </h2>
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
            placeholder="Название кешбека"
            value={edit.name || ''}
            onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            autoFocus
          />

          <div>
            <label className="text-sm text-gray-500 mb-1 block">MCC коды (необязательно)</label>
            <div className="space-y-2">
              {edit.mccInputs.map((mcc, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="number"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Например 5411"
                    value={mcc}
                    onChange={(e) => updateMccInput(i, e.target.value)}
                  />
                  <button
                    onClick={() => removeMccInput(i)}
                    className="px-2 text-red-500 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addMccInput}
                className="text-blue-600 text-sm"
              >
                ＋ Добавить MCC
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setEdit(null)} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm">Отмена</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm">
              {saving ? '...' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {cashbacks.length === 0 && !edit && (
          <div className="text-center text-gray-400 py-8 text-sm">
            Пока нет кешбеков. Нажмите "＋ Добавить кешбек", чтобы создать первый.
          </div>
        )}
        {cashbacks.map((cb) => (
          <div key={cb.id} className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{cb.name}</div>
                {cb.mccList && cb.mccList.length > 0 && (
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
                <button onClick={() => initForm(cb)} className="text-gray-400 text-sm px-2">✏️</button>
                <button onClick={() => cb.id && handleDelete(cb.id)} className="text-gray-400 text-sm px-2">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => initForm()}
        className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm"
      >
        ＋ Добавить кешбек
      </button>
    </div>
  )
}