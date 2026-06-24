import dayjs from 'dayjs'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Account, type Bank, type AccountCashback } from '@/db'

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

export function useCashbackSummary(year: number, month: number) {
  return useLiveQuery(async () => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0, 23, 59, 59)

    const [allAc, allCb, accounts, banks, categories, transactions] = await Promise.all([
      db.accountCashbacks.toArray(),
      db.cashbacks.toArray(),
      db.accounts.orderBy('order').toArray(),
      db.banks.orderBy('order').toArray(),
      db.categories.toArray(),
      db.transactions
        .where('date')
        .between(firstDay, lastDay, true, true)
        .toArray(),
    ])

    const cbMap = new Map(allCb.map((cb) => [cb.id!, cb]))
    const catMap = new Map(categories.map((c) => [c.id!, c]))

    function fmtDate(d: Date) {
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      return `${dd}.${mm}.${d.getFullYear()}`
    }

    function formatDateRange(ac: AccountCashback): string | null {
      const s = dayjs(ac.startDate)
      const e = dayjs(ac.endDate)
      const startsFirst = s.date() === 1 && s.month() === month - 1 && s.year() === year
      const endsLast = e.date() === e.daysInMonth() && e.month() === month - 1 && e.year() === year
      if (startsFirst && endsLast) return null
      const showStart = ac.startDate > firstDay ? ac.startDate : null
      const showEnd = ac.endDate < lastDay ? ac.endDate : null
      if (showStart && showEnd) return `${fmtDate(showStart)} — ${fmtDate(showEnd)}`
      if (showStart) return `с ${fmtDate(showStart)}`
      if (showEnd) return `до ${fmtDate(showEnd)}`
      return null
    }

    const result: {
      account: Account
      bank: Bank
      items: {
        name: string
        percent: number
        categoryName?: string
        dateRange: string | null
        calculatedAmount: number
      }[]
    }[] = []

    for (const account of accounts) {
      const activeAc = allAc.filter(
        (ac) => ac.accountId === account.id && ac.startDate <= lastDay && ac.endDate >= firstDay
      )
      if (activeAc.length === 0) continue

      const bank = banks.find((b) => b.id === account.bankId)
      if (!bank) continue

      const items: {
        name: string
        percent: number
        categoryName?: string
        dateRange: string | null
        calculatedAmount: number
      }[] = []

      for (const ac of activeAc) {
        const cb = cbMap.get(ac.cashbackId)
        if (!cb) continue

        let qualifying = transactions.filter(
          (t) => t.accountId === account.id && t.type === 'expense' && t.amount > 0
        )
        if (ac.categoryId) {
          qualifying = qualifying.filter((t) => t.categoryId === ac.categoryId)
        }
        if (cb.mccList && cb.mccList.length > 0) {
          qualifying = qualifying.filter((t) => t.mcc != null && cb.mccList!.includes(t.mcc))
        }

        const totalSpent = qualifying.reduce((s, t) => s + t.amount, 0)
        const calculatedAmount = Math.round(totalSpent * (ac.percent / 100) * 100) / 100
        const category = ac.categoryId ? catMap.get(ac.categoryId) : undefined

        items.push({
          name: cb.name,
          percent: ac.percent,
          categoryName: category?.name,
          dateRange: formatDateRange(ac),
          calculatedAmount,
        })
      }

      if (items.length > 0) {
        result.push({ account, bank, items })
      }
    }

    return result
  }, [year, month])
}