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
  const count = await db.accounts.where('bankId').equals(id).count()
  if (count > 0) {
    throw new Error(`Нельзя удалить банк: к нему привязано ${count} счетов`)
  }
  return db.banks.delete(id)
}