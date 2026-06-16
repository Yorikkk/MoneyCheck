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
  return db.accounts.delete(id)
}

export async function reorderAccounts(ids: number[]) {
  await db.transaction('rw', db.accounts, async () => {
    for (let i = 0; i < ids.length; i++) {
      await db.accounts.update(ids[i], { order: i })
    }
  })
}