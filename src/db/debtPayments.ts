import { db, type DebtPayment } from './db'

export async function getDebtPayments(debtId: number) {
  return db.debtPayments.where('debtId').equals(debtId).reverse().toArray()
}

export async function addDebtPayment(payment: Omit<DebtPayment, 'id' | 'createdAt'>) {
  return db.debtPayments.add({
    ...payment,
    createdAt: new Date(),
  })
}

export async function updateDebtPayment(id: number, changes: Partial<DebtPayment>) {
  return db.debtPayments.update(id, changes)
}

export async function deleteDebtPayment(id: number) {
  return db.debtPayments.delete(id)
}