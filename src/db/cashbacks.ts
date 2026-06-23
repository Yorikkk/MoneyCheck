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
  const count = await db.accountCashbacks.where('cashbackId').equals(id).count()
  if (count > 0) {
    throw new Error(`Нельзя удалить кешбек: к нему привязано ${count} кешбек(ов) счетов`)
  }
  return db.cashbacks.delete(id)
}