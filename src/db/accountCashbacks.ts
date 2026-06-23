import { db, type AccountCashback } from './db'

export async function getAccountCashbacks(accountId: number) {
  return db.accountCashbacks.where('accountId').equals(accountId).toArray()
}

export async function addAccountCashback(cashback: Omit<AccountCashback, 'id'>) {
  return db.accountCashbacks.add(cashback)
}

export async function updateAccountCashback(id: number, changes: Partial<AccountCashback>) {
  return db.accountCashbacks.update(id, changes)
}

export async function deleteAccountCashback(id: number) {
  return db.accountCashbacks.delete(id)
}