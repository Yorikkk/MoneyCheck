import { useState, useEffect } from 'react'
import { useBudgets, useCategories } from '@/hooks/useDb'
import { setBudget, deleteBudget } from '@/db'

export default function BudgetsManager({ onBack }: { onBack: () => void }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const budgetsQuery = useBudgets(month, year)
  const expenseCategories = useCategories('expense') ?? []
  const budgets = budgetsQuery ?? []
  const [values, setValues] = useState<Record<number, string>>({})

  useEffect(() => {
    if (!budgetsQuery) return
    const map: Record<number, string> = {}
    for (const b of budgetsQuery) {
      map[b.categoryId] = b.amount.toString()
    }
    setValues(map)
  }, [budgetsQuery])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else { setMonth(month - 1) }
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else { setMonth(month + 1) }
  }

  async function handleSave(categoryId: number) {
    const amount = Number(values[categoryId]) || 0
    try {
      if (amount === 0) {
        const existing = budgets.find((b) => b.categoryId === categoryId)
        if (existing?.id) await deleteBudget(existing.id)
      } else {
        await setBudget({ categoryId, month, year, amount })
      }
    } catch (e: unknown) {
      console.error('Ошибка сохранения бюджета:', e)
    }
  }

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-blue-600 text-lg">←</button>
        <h2 className="text-xl font-bold">Бюджеты</h2>
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm mb-4">
        <button onClick={prevMonth} className="text-blue-600 text-lg px-2">◀</button>
        <span className="font-semibold">{monthNames[month - 1]} {year}</span>
        <button onClick={nextMonth} className="text-blue-600 text-lg px-2">▶</button>
      </div>

      <div className="space-y-2">
        {expenseCategories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
            <span className="text-xl">{cat.icon}</span>
            <span className="flex-1 font-medium text-sm truncate">{cat.name}</span>
            <input
              type="number"
              className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-right"
              placeholder="0"
              value={values[cat.id!] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [cat.id!]: e.target.value }))}
              onBlur={() => handleSave(cat.id!)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}