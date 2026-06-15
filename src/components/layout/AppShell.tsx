import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Главная', icon: '🏠' },
  { to: '/add', label: 'Добавить', icon: '➕' },
  { to: '/balance', label: 'Баланс', icon: '💵' },
  { to: '/transactions', label: 'История', icon: '📋' },
  { to: '/reports', label: 'Отчёты', icon: '📊' },
  { to: '/settings', label: 'Настройки', icon: '⚙️' },
]

export function AppShell({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div className={`flex flex-col h-dvh max-w-lg mx-auto bg-gray-50 ${className}`}>
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-lg mx-auto">
        <ul className="flex justify-around py-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-1 py-1 text-[10px] ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`
                }
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}