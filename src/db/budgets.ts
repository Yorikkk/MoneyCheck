import { db, type Budget } from './db'

export async function getBudgets(month: number, year: number) {
  return db.budgets.where({ month, year }).toArray()
}

export async function setBudget(budget: Omit<Budget, 'id'>) {
  const existing = await db.budgets
    .where({ month: budget.month, year: budget.year, categoryId: budget.categoryId })
    .first()

  if (existing) {
    return db.budgets.update(existing.id!, { amount: budget.amount })
  }
  return db.budgets.add(budget)
}

export async function deleteBudget(id: number) {
  return db.budgets.delete(id)
}