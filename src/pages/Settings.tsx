import { useState } from 'react'
import CategoriesManager from '@/components/settings/CategoriesManager'
import AccountTypesManager from '@/components/settings/AccountTypesManager'
import AccountsManager from '@/components/settings/AccountsManager'
import FamilyMembersManager from '@/components/settings/FamilyMembersManager'
import BudgetsManager from '@/components/settings/BudgetsManager'

type View = 'main' | 'categories' | 'accountTypes' | 'accounts' | 'familyMembers' | 'budgets'

const menuItems: { view: View; icon: string; label: string; desc: string }[] = [
  { view: 'categories', icon: '📂', label: 'Категории', desc: 'Расходы и доходы' },
  { view: 'accountTypes', icon: '🏷️', label: 'Типы счетов', desc: 'Наличные, кредиты, ипотека...' },
  { view: 'accounts', icon: '💰', label: 'Счета', desc: 'Банковские счета, кошельки' },
  { view: 'familyMembers', icon: '👨‍👩‍👧‍👦', label: 'Члены семьи', desc: 'Участники учёта' },
  { view: 'budgets', icon: '🎯', label: 'Бюджеты', desc: 'Лимиты по категориям' },
]

export default function Settings() {
  const [view, setView] = useState<View>('main')

  if (view === 'categories') return <CategoriesManager onBack={() => setView('main')} />
  if (view === 'accountTypes') return <AccountTypesManager onBack={() => setView('main')} />
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
    </div>
  )
}