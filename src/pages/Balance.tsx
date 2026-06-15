import { useNavigate } from 'react-router-dom'
import { useAccounts } from '@/hooks/useDb'
import { formatCurrency } from '@/lib/utils'

export default function Balance() {
  const navigate = useNavigate()
  const accounts = useAccounts() ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Баланс</h1>

      {accounts.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">Нет счетов</div>
      )}

      <div className="space-y-2">
        {accounts.map((account) => (
          <div
            key={account.id}
            onClick={() => navigate('/transactions', { state: { filterAccount: account.id } })}
            className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <span className="text-2xl">{account.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{account.name}</div>
            </div>
            <div className={`text-sm font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(account.balance)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}