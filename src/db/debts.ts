import { db, type Debt } from './db'

export async function getDebts(status?: 'active' | 'closed' | 'overdue') {
  if (status) {
    return db.debts.where('status').equals(status).reverse().toArray()
  }
  return db.debts.reverse().toArray()
}

export async function getDebtsByFamilyMember(familyMemberId: number) {
  return db.debts.where('familyMemberId').equals(familyMemberId).reverse().toArray()
}

export async function addDebt(debt: Omit<Debt, 'id' | 'createdAt'>) {
  return db.debts.add({
    ...debt,
    createdAt: new Date(),
  })
}

export async function updateDebt(id: number, changes: Partial<Debt>) {
  return db.debts.update(id, changes)
}

export async function deleteDebt(id: number) {
  return db.debts.delete(id)
}