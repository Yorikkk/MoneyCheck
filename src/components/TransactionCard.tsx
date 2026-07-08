import type { Transaction, Account, Category, Bank, AccountType } from '@/db'
import { formatCurrency } from '@/lib/utils'

interface TransactionCardProps {
  transaction: Transaction
  accounts: Account[]
  categories: Category[]
  banks: Bank[]
  accountTypes: AccountType[]
  cashback: number
}

export default function TransactionCard({
  transaction: tx,
  accounts,
  categories,
  banks,
  cashback,
}: TransactionCardProps) {
  const cat = categories.find((c) => c.id === tx.categoryId)
  const parentCat = cat?.parentId ? categories.find((c) => c.id === cat.parentId) : undefined
  const account = accounts.find((a) => a.id === tx.accountId)
  const toAccount = accounts.find((a) => a.id === tx.transferToAccountId)

  function getBankLabel(bankId: number) {
    const bank = banks.find((b) => b.id === bankId)
    return bank ? `${bank.icon} ${bank.name}` : ''
  }

  return (
    <div className="bg-white p-3 shadow-sm flex items-center gap-3 cursor-pointer">
      {tx.type === 'transfer' ? (
        <>
          <span className="text-lg">🔄</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              Перевод{tx.description ? `, ${tx.description}` : ''}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {account?.name} · {getBankLabel(account?.bankId ?? 0)} → {toAccount?.name} · {getBankLabel(toAccount?.bankId ?? 0)}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-semibold text-blue-600">
              {formatCurrency(tx.amount)}
            </div>
          </div>
        </>
      ) : (
        <>
          <span className="text-lg">{cat?.icon ?? '📦'}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {parentCat ? `${parentCat.name} · ` : ''}{cat?.name ?? '—'}{tx.description ? `, ${tx.description}` : ''}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {account?.name} · {getBankLabel(account?.bankId ?? 0)}
            </div>
            {(tx.mcc ?? cat?.mcc) && (
              <div className="text-xs text-gray-400 font-mono">MCC {tx.mcc ?? cat?.mcc}</div>
            )}
            {tx.principalAmount && (
              <div className="text-xs text-orange-500">Тело: {formatCurrency(tx.principalAmount)}</div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
            </div>
            {cashback > 0 && (
              <div className="text-xs text-green-500 font-medium">💳 +{formatCurrency(cashback)}</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}