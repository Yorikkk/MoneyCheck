import { db, type Bank } from './db'

export async function getBanks() {
  return db.banks.orderBy('order').toArray()
}

export async function addBank(bank: Omit<Bank, 'id'>) {
  return db.banks.add(bank)
}

export async function updateBank(id: number, changes: Partial<Bank>) {
  return db.banks.update(id, changes)
}

export async function deleteBank(id: number) {
  const accountsCount = await db.accounts.where('bankId').equals(id).count()
  if (accountsCount > 0) {
    throw new Error(`Нельзя удалить банк: к нему привязано ${accountsCount} счетов`)
  }
  const cashbacksCount = await db.cashbacks.where('bankId').equals(id).count()
  if (cashbacksCount > 0) {
    throw new Error(`Нельзя удалить банк: у него ${cashbacksCount} кешбеков`)
  }
  return db.banks.delete(id)
}