import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'

export function useTransactionsByMonth(year: number, month: number) {
  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 0, 23, 59, 59)

  return useLiveQuery(() =>
    db.transactions
      .where('date')
      .between(from, to, true, true)
      .reverse()
      .toArray()
  , [year, month])
}

export function useAllTransactions() {
  return useLiveQuery(() =>
    db.transactions.orderBy('date').reverse().toArray()
  , [])
}

export function useCategories(type?: 'income' | 'expense') {
  return useLiveQuery(() => {
    let coll = db.categories.orderBy('order')
    if (type) coll = coll.filter((c) => c.type === type) as typeof coll
    return coll.toArray()
  }, [type])
}

export function useBudgets(month: number, year: number) {
  return useLiveQuery(() =>
    db.budgets.where({ month, year }).toArray()
  , [month, year])
}

export function useFamilyMembers() {
  return useLiveQuery(() =>
    db.familyMembers.toArray()
  , [])
}