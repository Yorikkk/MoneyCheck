import { useRef, useState } from 'react'
import CategoriesManager from '@/components/settings/CategoriesManager'
import AccountTypesManager from '@/components/settings/AccountTypesManager'
import BanksManager from '@/components/settings/BanksManager'
import AccountsManager from '@/components/settings/AccountsManager'
import FamilyMembersManager from '@/components/settings/FamilyMembersManager'
import BudgetsManager from '@/components/settings/BudgetsManager'
import { exportData, importData } from '@/db'

type View = 'main' | 'categories' | 'accountTypes' | 'banks' | 'accounts' | 'familyMembers' | 'budgets'

const menuItems: { view: View; icon: string; label: string; desc: string }[] = [
  { view: 'categories', icon: '📂', label: 'Категории', desc: 'Расходы и доходы' },
  { view: 'accountTypes', icon: '🏷️', label: 'Типы счетов', desc: 'Наличные, кредиты, ипотека...' },
  { view: 'banks', icon: '🏛️', label: 'Банки', desc: 'Сбербанк, Т-Банк, Альфа...' },
  { view: 'accounts', icon: '💰', label: 'Счета', desc: 'Банковские счета, кошельки' },
  { view: 'familyMembers', icon: '👨‍👩‍👧‍👦', label: 'Члены семьи', desc: 'Участники учёта' },
  { view: 'budgets', icon: '🎯', label: 'Бюджеты', desc: 'Лимиты по категориям' },
]

export default function Settings() {
  const [view, setView] = useState<View>('main')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    const json = await exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date().toISOString().slice(0, 10)
    a.download = `moneycheck-backup-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const confirmed = window.confirm(
      'Все текущие данные будут заменены данными из дампа. Продолжить?'
    )
    if (!confirmed) return

    try {
      const text = await file.text()
      await importData(text)
      window.location.reload()
    } catch (err) {
      alert('Ошибка импорта: ' + (err instanceof Error ? err.message : 'неизвестная ошибка'))
    }

    e.target.value = ''
  }

  if (view === 'categories') return <CategoriesManager onBack={() => setView('main')} />
  if (view === 'accountTypes') return <AccountTypesManager onBack={() => setView('main')} />
  if (view === 'banks') return <BanksManager onBack={() => setView('main')} />
  if (view === 'accounts') return <AccountsManager onBack={() => setView('main')} />
  if (view === 'familyMembers') return <FamilyMembersManager onBack={() => setView('main')} />
  if (view === 'budgets') return <BudgetsManager onBack={() => setView('main')} />

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Настройки</h1>
      <div className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 text-left"
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-sm text-gray-500">{item.desc}</div>
            </div>
            <span className="ml-auto text-gray-400">→</span>
          </button>
        ))}
      </div>

      <div className="mt-8 border-t pt-6">
        <h2 className="text-lg font-semibold mb-3">Управление данными</h2>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 justify-center text-left"
          >
            <span className="text-xl">📥</span>
            <span className="font-medium">Экспорт</span>
          </button>
          <button
            onClick={handleImport}
            className="flex-1 bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 justify-center text-left"
          >
            <span className="text-xl">📤</span>
            <span className="font-medium">Импорт</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}