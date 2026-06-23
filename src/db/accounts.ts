import { db, type Account } from './db'

export async function getAccounts() {
  return db.accounts.orderBy('order').toArray()
}

export async function getAccountsByFamilyMember(familyMemberId: number) {
  return db.accounts.where('familyMemberId').equals(familyMemberId).sortBy('order')
}

export async function addAccount(account: Omit<Account, 'id' | 'createdAt'>) {
  return db.accounts.add({
    ...account,
    createdAt: new Date(),
  })
}

export async function updateAccount(id: number, changes: Partial<Account>) {
  return db.accounts.update(id, changes)
}

export async function deleteAccount(id: number) {
  const [txCount, transferCount, acCount] = await Promise.all([
    db.transactions.where('accountId').equals(id).count(),
    db.transactions.where('transferToAccountId').equals(id).count(),
    db.accountCashbacks.where('accountId').equals(id).count(),
  ])

  if (txCount > 0 || transferCount > 0 || acCount > 0) {
    const parts: string[] = []
    if (txCount > 0) parts.push(`${txCount} транзакци(й)`)
    if (transferCount > 0) parts.push(`${transferCount} перевод(ов)`)
    if (acCount > 0) parts.push(`${acCount} кешбек(ов) счёта`)
    throw new Error(`Нельзя удалить счёт: к нему привязано ${parts.join(', ')}`)
  }

  return db.accounts.delete(id)
}

export async function reorderAccounts(ids: number[]) {
  await db.transaction('rw', db.accounts, async () => {
    for (let i = 0; i < ids.length; i++) {
      await db.accounts.update(ids[i], { order: i })
    }
  })
}