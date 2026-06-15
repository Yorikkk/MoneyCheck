import { db, type AccountType } from './db'

export async function getAccountTypes() {
  return db.accountTypes.orderBy('order').toArray()
}

export async function addAccountType(type: Omit<AccountType, 'id'>) {
  return db.accountTypes.add(type)
}

export async function updateAccountType(id: number, changes: Partial<AccountType>) {
  return db.accountTypes.update(id, changes)
}

export async function deleteAccountType(id: number) {
  return db.accountTypes.delete(id)
}