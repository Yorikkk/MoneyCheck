import { useNavigate } from 'react-router-dom'
import { useAccounts, useAccountTypes, useBanks } from '@/hooks/useDb'
import { formatCurrency } from '@/lib/utils'

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Баланс</h1>

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