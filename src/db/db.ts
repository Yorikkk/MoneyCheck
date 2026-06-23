import Dexie, { type EntityTable } from 'dexie'

export interface Transaction {
  id?: number
  amount: number
  description: string
  categoryId?: number
  accountId: number
  familyMemberId: number
  date: Date
  type: 'income' | 'expense' | 'transfer'
  principalAmount?: number | null
  interestAmount?: number | null
  transferToAccountId?: number
  mcc?: number
  createdAt: Date
}

export interface Category {
  id?: number
  name: string
  icon: string
  color: string
  type: 'income' | 'expense'
  order: number
  parentId?: number
  mcc?: number
}

export type CategoryTreeNode = Category & { children: CategoryTreeNode[] }

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

export interface AccountType {
  id?: number
  name: string
  icon: string
  color: string
  order: number
  isLoan: boolean
}

export interface Bank {
  id?: number
  name: string
  icon: string
  color: string
  order: number
}

export interface Account {
  id?: number
  name: string
  typeId: number
  bankId: number
  currency: string
  balance: number
  icon: string
  color: string
  familyMemberId: number
  order: number
  createdAt: Date
}

export interface Debt {
  id?: number
  type: 'lent' | 'borrowed'
  personName: string
  description: string
  amount: number
  interestRate: number
  startDate: Date
  dueDate: Date
  status: 'active' | 'closed' | 'overdue'
  familyMemberId: number
  createdAt: Date
  closedAt?: Date | null
}

export interface DebtPayment {
  id?: number
  debtId: number
  amount: number
  date: Date
  note?: string
  createdAt: Date
}

export interface Cashback {
  id?: number
  bankId: number
  name: string
  percent: number
  categoryId?: number
  mccList?: number[]
}

const db = new Dexie('MoneyCheckDB') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>
  categories: EntityTable<Category, 'id'>
  budgets: EntityTable<Budget, 'id'>
  familyMembers: EntityTable<FamilyMember, 'id'>
  accountTypes: EntityTable<AccountType, 'id'>
  accounts: EntityTable<Account, 'id'>
  debts: EntityTable<Debt, 'id'>
  debtPayments: EntityTable<DebtPayment, 'id'>
  banks: EntityTable<Bank, 'id'>
  cashbacks: EntityTable<Cashback, 'id'>
}

db.version(1).stores({
  transactions: '++id, date, categoryId, type',
  categories: '++id, type',
  budgets: '++id, [month+year]',
  familyMembers: '++id',
})

db.version(2).stores({
  transactions: '++id, date, categoryId, type, accountId',
  categories: '++id, type',
  budgets: '++id, [month+year]',
  familyMembers: '++id',
  accountTypes: '++id',
  accounts: '++id, familyMemberId',
  debts: '++id, status, familyMemberId',
  debtPayments: '++id, debtId',
})

db.version(3).stores({
  transactions: '++id, date, categoryId, type, accountId',
  categories: '++id, type, order',
  budgets: '++id, [month+year]',
  familyMembers: '++id',
  accountTypes: '++id, order',
  accounts: '++id, familyMemberId',
  debts: '++id, status, familyMemberId',
  debtPayments: '++id, debtId',
})

db.version(4).stores({
  transactions: '++id, date, categoryId, type, accountId',
  categories: '++id, type, order',
  budgets: '++id, [month+year]',
  familyMembers: '++id',
  accountTypes: '++id, order',
  accounts: '++id, familyMemberId, order',
  debts: '++id, status, familyMemberId',
  debtPayments: '++id, debtId',
}).upgrade(async (tx) => {
  let i = 0
  await tx.table('accounts').each((account: Account) => {
    tx.table('accounts').update(account.id!, { order: i++ })
  })
})

db.version(5).stores({
  transactions: '++id, date, categoryId, type, accountId, transferToAccountId',
  categories: '++id, type, order',
  budgets: '++id, [month+year]',
  familyMembers: '++id',
  accountTypes: '++id, order',
  accounts: '++id, familyMemberId, order',
  debts: '++id, status, familyMemberId',
  debtPayments: '++id, debtId',
})

db.version(6).stores({
  transactions: '++id, date, categoryId, type, accountId, transferToAccountId',
  categories: '++id, type, order, parentId',
  budgets: '++id, [month+year]',
  familyMembers: '++id',
  accountTypes: '++id, order',
  accounts: '++id, familyMemberId, order',
  debts: '++id, status, familyMemberId',
  debtPayments: '++id, debtId',
})

db.version(7).stores({
  transactions: '++id, date, categoryId, type, accountId, transferToAccountId',
  categories: '++id, type, order, parentId',
  budgets: '++id, [month+year]',
  familyMembers: '++id',
  accountTypes: '++id, order',
  accounts: '++id, familyMemberId, order',
  debts: '++id, status, familyMemberId',
  debtPayments: '++id, debtId',
})

db.version(8).stores({
  transactions: '++id, date, categoryId, type, accountId, transferToAccountId',
  categories: '++id, type, order, parentId',
  budgets: '++id, [month+year]',
  familyMembers: '++id',
  accountTypes: '++id, order',
  accounts: '++id, familyMemberId, order, bankId',
  debts: '++id, status, familyMemberId',
  debtPayments: '++id, debtId',
  banks: '++id, order',
}).upgrade(async (tx) => {
  const banksCount = await tx.table('banks').count()
  if (banksCount === 0) return
  const firstBank = await tx.table('banks').orderBy('order').first()
  if (!firstBank) return
  await tx.table('accounts').each((account: Account) => {
    if (!(account as any).bankId) {
      tx.table('accounts').update(account.id!, { bankId: firstBank.id })
    }
  })
})

db.version(9).stores({
  transactions: '++id, date, categoryId, type, accountId, transferToAccountId',
  categories: '++id, type, order, parentId',
  budgets: '++id, [month+year]',
  familyMembers: '++id',
  accountTypes: '++id, order',
  accounts: '++id, familyMemberId, order, bankId, typeId',
  debts: '++id, status, familyMemberId',
  debtPayments: '++id, debtId',
  banks: '++id, order',
})

db.version(10).stores({
  transactions: '++id, date, categoryId, type, accountId, transferToAccountId',
  categories: '++id, type, order, parentId',
  budgets: '++id, [month+year]',
  familyMembers: '++id',
  accountTypes: '++id, order',
  accounts: '++id, familyMemberId, order, bankId, typeId',
  debts: '++id, status, familyMemberId',
  debtPayments: '++id, debtId',
  banks: '++id, order',
  cashbacks: '++id, bankId',
})

export { db }