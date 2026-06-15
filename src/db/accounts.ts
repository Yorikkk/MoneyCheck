import { db, type Account } from './db'

export async function getAccounts() {
  return db.accounts.toArray()
}

export async function getAccountsByFamilyMember(familyMemberId: number) {
  return db.accounts.where('familyMemberId').equals(familyMemberId).toArray()
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