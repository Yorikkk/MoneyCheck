import Dexie, { type EntityTable } from 'dexie'

export interface Transaction {
  id?: number
  amount: number
  description: string
  categoryId: number
  familyMemberId: number
  date: Date
  type: 'income' | 'expense'
  createdAt: Date
}

export interface Category {
  id?: number
  name: string
  icon: string
  color: string
  type: 'income' | 'expense'
  order: number
}

export interface Budget {
  id?: number
  categoryId: number
  month: number
  year: number
  amount: number
}

export interface FamilyMember {
  id?: number
  name: string
  avatar?: string
  color?: string
}

const db = new Dexie('MoneyCheckDB') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>
  categories: EntityTable<Category, 'id'>
  budgets: EntityTable<Budget, 'id'>
  familyMembers: EntityTable<FamilyMember, 'id'>
}

db.version(1).stores({
  transactions: '++id, date, categoryId, type',
  categories: '++id, type',
  budgets: '++id, [month+year]',
  familyMembers: '++id',
})

export { db }