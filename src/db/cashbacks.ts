import { db, type Cashback } from './db'

export async function getCashbacksByBank(bankId: number) {
  return db.cashbacks.where('bankId').equals(bankId).toArray()
}

export async function addCashback(cashback: Omit<Cashback, 'id'>) {
  return db.cashbacks.add(cashback)
}

export async function updateCashback(id: number, changes: Partial<Cashback>) {
  return db.cashbacks.update(id, changes)
}

export async function deleteCashback(id: number) {
  return db.cashbacks.delete(id)
}