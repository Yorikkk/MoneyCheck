import { useNavigate } from 'react-router-dom'
import { useAccounts, useAccountTypes, useBanks } from '@/hooks/useDb'
import { formatCurrency } from '@/lib/utils'

const FREE_MONEY_TYPE_NAMES = ['Дебетовая карта', 'Накопительный счёт']

export default function Balance() {
  const navigate = useNavigate()
  const accounts = useAccounts() ?? []
  const accountTypes = useAccountTypes() ?? []
  const banks = useBanks() ?? []

  const typeKindMap: Record<number, 'regular' | 'credit' | 'mortgage'> = {}
  for (const at of accountTypes) {
    if (at.id != null) typeKindMap[at.id] = at.kind
  }

  const regularAccounts = accounts.filter((a) => typeKindMap[a.typeId] === 'regular')
  const creditAccounts = accounts.filter((a) => typeKindMap[a.typeId] === 'credit')
  const mortgageAccounts = accounts.filter((a) => typeKindMap[a.typeId] === 'mortgage')

  const freeMoneyTypeIds = new Set(
    accountTypes.filter((t) => FREE_MONEY_TYPE_NAMES.includes(t.name)).map((t) => t.id!),
  )
  const freeAccounts = accounts.filter((a) => freeMoneyTypeIds.has(a.typeId))

  function renderCard(
    account: (typeof accounts)[number],
    isDebt: boolean,
  ) {
    const bank = banks.find((b) => b.id === account.bankId)
    const bankLabel = bank ? `${bank.icon} ${bank.name}` : ''
    const balanceColor = isDebt
      ? 'text-red-600'
      : account.balance >= 0
        ? 'text-green-600'
        : 'text-red-600'

    return (
      <div
        key={account.id}
        onClick={() => navigate('/transactions', { state: { filterAccount: account.id } })}
        className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shrink-0"
             style={{ backgroundColor: account.color }}>
          {account.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{account.name}</div>
          <div className="text-xs text-gray-400">{bankLabel}</div>
        </div>
        <div className={`text-sm font-semibold ${balanceColor}`}>
          {formatCurrency(account.balance)}
        </div>
      </div>
    )
  }

  const allEmpty = accounts.length === 0

  const totalRegular = regularAccounts.reduce((sum, a) => sum + a.balance, 0)
  const totalFree = freeAccounts.reduce((sum, a) => sum + a.balance, 0)
  const totalDebt = [...creditAccounts, ...mortgageAccounts].reduce((sum, a) => sum + a.balance, 0)
  const max = Math.max(totalRegular, totalFree, totalDebt)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Баланс</h1>

      <div className="space-y-2 mb-4">
        <div className="relative h-8 bg-gray-500 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 rounded-full transition-all"
            style={{ width: max > 0 ? `${(totalFree / max) * 100}%` : '0%' }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] px-2 truncate">
            Свободные деньги · {formatCurrency(totalFree)}
          </span>
        </div>
        <div className="relative h-8 bg-gray-500 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: max > 0 ? `${(totalRegular / max) * 100}%` : '0%' }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] px-2 truncate">
            Счета · {formatCurrency(totalRegular)}
          </span>
        </div>
        <div className="relative h-8 bg-gray-500 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-full transition-all"
            style={{ width: max > 0 ? `${(totalDebt / max) * 100}%` : '0%' }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] px-2 truncate">
            Долги · {formatCurrency(totalDebt)}
          </span>
        </div>
      </div>

      {allEmpty && (
        <div className="text-center py-8 text-gray-400 text-sm">Нет счетов</div>
      )}

      {!allEmpty && (
        <div className="space-y-3">
          {regularAccounts.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md">
                Обычные счета
              </div>
              {regularAccounts.map((a) => renderCard(a, false))}
            </div>
          )}

          {creditAccounts.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md">
                Кредитные
              </div>
              {creditAccounts.map((a) => renderCard(a, true))}
            </div>
          )}

          {mortgageAccounts.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md">
                Ипотека
              </div>
              {mortgageAccounts.map((a) => renderCard(a, true))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}