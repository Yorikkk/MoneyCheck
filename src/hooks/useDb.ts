import dayjs from 'dayjs'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Bank, type Cashback, type AccountCashback, type Transaction } from '@/db'

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
    const accountMap = new Map(accounts.map((a) => [a.id!, a]))

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

    const acByAccount = new Map<number, AccountCashback[]>()
    for (const ac of allAc) {
      if (ac.startDate <= lastDay && ac.endDate >= firstDay) {
        let list = acByAccount.get(ac.accountId)
        if (!list) { list = []; acByAccount.set(ac.accountId, list) }
        list.push(ac)
      }
    }

    const ruleAmounts = new Map<number, number>()

    for (const t of transactions) {
      if (t.type !== 'expense' || t.amount <= 0) continue

      const acList = acByAccount.get(t.accountId)
      if (!acList || acList.length === 0) continue

      const cbList: { ac: AccountCashback; cb: Cashback }[] = []
      for (const ac of acList) {
        const cb = cbMap.get(ac.cashbackId)
        if (cb) cbList.push({ ac, cb })
      }

      let found = cbList.find((x) => x.ac.categoryId != null && x.ac.categoryId === t.categoryId)
      if (!found && t.mcc != null) {
        found = cbList.find((x) => x.cb.mccList && x.cb.mccList.length > 0 && x.cb.mccList.includes(t.mcc!))
      }
      if (!found) {
        found = cbList.find((x) => x.ac.categoryId == null && (!x.cb.mccList || x.cb.mccList.length === 0))
      }

      if (found) {
        const acId = found.ac.id!
        ruleAmounts.set(acId, (ruleAmounts.get(acId) ?? 0) + (t.amount * found.ac.percent) / 100)
      }
    }

    function itemKey(ac: AccountCashback, cb: Cashback): string {
      return `${cb.name}|${ac.percent}|${ac.categoryId ?? ''}|${formatDateRange(ac) ?? ''}`
    }

    const bankGroups = new Map<number, {
      bank: Bank
      totalCashback: number
      items: Map<string, {
        name: string
        percent: number
        categoryName?: string
        dateRange: string | null
        calculatedAmount: number
      }>
    }>()

    function addToBank(bank: Bank, ac: AccountCashback, cb: Cashback, amount: number) {
      let group = bankGroups.get(bank.id!)
      if (!group) {
        group = { bank, totalCashback: 0, items: new Map() }
        bankGroups.set(bank.id!, group)
      }

      const key = itemKey(ac, cb)
      const existing = group.items.get(key)
      if (existing) {
        existing.calculatedAmount += amount
      } else {
        const category = ac.categoryId ? catMap.get(ac.categoryId) : undefined
        group.items.set(key, {
          name: cb.name,
          percent: ac.percent,
          categoryName: category?.name,
          dateRange: formatDateRange(ac),
          calculatedAmount: amount,
        })
      }
      group.totalCashback += amount
    }

    const processedIds = new Set<number>()

    for (const [acId, amount] of ruleAmounts) {
      const ac = allAc.find((a) => a.id === acId)
      if (!ac) continue
      const account = accountMap.get(ac.accountId)
      if (!account) continue
      const bank = banks.find((b) => b.id === account.bankId)
      if (!bank) continue
      const cb = cbMap.get(ac.cashbackId)
      if (!cb) continue
      addToBank(bank, ac, cb, amount)
      processedIds.add(acId)
    }

    for (const ac of allAc) {
      if (processedIds.has(ac.id!)) continue
      if (ac.startDate > lastDay || ac.endDate < firstDay) continue
      const account = accountMap.get(ac.accountId)
      if (!account) continue
      const bank = banks.find((b) => b.id === account.bankId)
      if (!bank) continue
      const cb = cbMap.get(ac.cashbackId)
      if (!cb) continue
      addToBank(bank, ac, cb, 0)
    }

    return [...bankGroups.values()]
      .map((g) => ({
        bank: g.bank,
        totalCashback: Math.round(g.totalCashback * 100) / 100,
        items: [...g.items.values()]
          .map((item) => ({ ...item, calculatedAmount: Math.round(item.calculatedAmount * 100) / 100 }))
          .sort((a, b) => {
            const aPos = a.calculatedAmount > 0 ? 1 : 0
            const bPos = b.calculatedAmount > 0 ? 1 : 0
            if (aPos !== bPos) return bPos - aPos
            return b.calculatedAmount - a.calculatedAmount
          }),
      }))
      .sort((a, b) => a.bank.order - b.bank.order)
  }, [year, month])
}

export function useCashbackForTransactions() {
  return useLiveQuery(async () => {
    const [allAc, allCb] = await Promise.all([
      db.accountCashbacks.toArray(),
      db.cashbacks.toArray(),
    ])

    const cbMap = new Map(allCb.map((cb) => [cb.id!, cb]))
    const acByAccount = new Map<number, AccountCashback[]>()
    for (const ac of allAc) {
      let list = acByAccount.get(ac.accountId)
      if (!list) { list = []; acByAccount.set(ac.accountId, list) }
      list.push(ac)
    }

    return (tx: Transaction): number => {
      if (tx.type !== 'expense' || tx.amount <= 0) return 0

      const acList = acByAccount.get(tx.accountId)
      if (!acList || acList.length === 0) return 0

      const cbList: { ac: AccountCashback; cb: Cashback }[] = []
      for (const ac of acList) {
        if (ac.startDate > tx.date || ac.endDate < tx.date) continue
        const cb = cbMap.get(ac.cashbackId)
        if (cb) cbList.push({ ac, cb })
      }

      let found = cbList.find((x) => x.ac.categoryId != null && x.ac.categoryId === tx.categoryId)
      if (!found && tx.mcc != null) {
        found = cbList.find((x) => x.cb.mccList && x.cb.mccList.length > 0 && x.cb.mccList.includes(tx.mcc!))
      }
      if (!found) {
        found = cbList.find((x) => x.ac.categoryId == null && (!x.cb.mccList || x.cb.mccList.length === 0))
      }

      if (found) {
        return Math.round((tx.amount * found.ac.percent) / 100 * 100) / 100
      }
      return 0
    }
  }, [])
}