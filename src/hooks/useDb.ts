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

export function useTransactionsByAccount(accountId: number) {
  return useLiveQuery(() =>
    db.transactions.where('accountId').equals(accountId).reverse().toArray()
  , [accountId])
}

export function useCategories(type?: 'income' | 'expense') {
  return useLiveQuery(() => {
    let coll = db.categories.orderBy('order')
    if (type) coll = coll.filter((c) => c.type === type) as typeof coll
    return coll.toArray()
  }, [type])
}

export function useRootCategories(type?: 'income' | 'expense') {
  return useLiveQuery(() => {
    let coll = db.categories.orderBy('order')
    coll = coll.filter((c) => !c.parentId) as typeof coll
    if (type) coll = coll.filter((c) => c.type === type) as typeof coll
    return coll.toArray()
  }, [type])
}

export function useSubcategories(parentId: number | null) {
  return useLiveQuery(() => {
    if (parentId === null) return []
    return db.categories.where('parentId').equals(parentId).sortBy('order')
  }, [parentId])
}

export function useHasSubcategories(id: number) {
  return useLiveQuery(async () => {
    const count = await db.categories.where('parentId').equals(id).count()
    return count > 0
  }, [id])
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

export function useAccountTypes() {
  return useLiveQuery(() =>
    db.accountTypes.orderBy('order').toArray()
  , [])
}

export function useBanks() {
  return useLiveQuery(() =>
    db.banks.orderBy('order').toArray()
  , [])
}

export function useAccounts() {
  return useLiveQuery(() =>
    db.accounts.orderBy('order').toArray()
  , [])
}

export function useAccountsByFamilyMember(familyMemberId: number) {
  return useLiveQuery(() =>
    db.accounts.where('familyMemberId').equals(familyMemberId).toArray()
  , [familyMemberId])
}

export function useDebts(status?: 'active' | 'closed' | 'overdue') {
  return useLiveQuery(() => {
    if (status) return db.debts.where('status').equals(status).reverse().toArray()
    return db.debts.reverse().toArray()
  }, [status])
}

export function useDebtPayments(debtId: number) {
  return useLiveQuery(() =>
    db.debtPayments.where('debtId').equals(debtId).reverse().toArray()
  , [debtId])
}

export function useCashbacks(bankId: number) {
  return useLiveQuery(() =>
    db.cashbacks.where('bankId').equals(bankId).toArray()
  , [bankId])
}

export function useAccountCashbacks(accountId: number) {
  return useLiveQuery(() =>
    db.accountCashbacks.where('accountId').equals(accountId).toArray()
  , [accountId])
}

export function useAllCategories() {
  return useLiveQuery(() =>
    db.categories.orderBy('order').toArray()
  , [])
}