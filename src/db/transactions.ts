import { db, type Transaction } from './db'

export async function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>) {
  return db.transactions.add({
    ...tx,
    createdAt: new Date(),
  })
}

export async function getTransactionsByDateRange(from: Date, to: Date) {
  return db.transactions
    .where('date')
    .between(from, to, true, true)
    .reverse()
    .toArray()
}

export async function getTransactionsByCategory(categoryId: number) {
  return db.transactions
    .where('categoryId')
    .equals(categoryId)
    .reverse()
    .toArray()
}

export async function getAllTransactions() {
  return db.transactions.orderBy('date').reverse().toArray()
}

export async function updateTransaction(id: number, changes: Partial<Transaction>) {
  return db.transactions.update(id, changes)
}

export async function deleteTransaction(id: number) {
  return db.transactions.delete(id)
}