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
  const count = await db.accounts.where('typeId').equals(id).count()
  if (count > 0) {
    throw new Error(`Нельзя удалить тип счета: к нему привязано ${count} счет(ов)`)
  }
  return db.accountTypes.delete(id)
}