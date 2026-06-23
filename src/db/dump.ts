import { db } from './db'

const TABLE_NAMES = [
  'accountTypes',
  'banks',
  'categories',
  'familyMembers',
  'cashbacks',
  'accounts',
  'accountCashbacks',
  'budgets',
  'transactions',
  'debts',
  'debtPayments',
] as const

const DATE_FIELDS: Record<string, Set<string>> = {
  transactions: new Set(['date', 'createdAt']),
  accounts: new Set(['createdAt']),
  debts: new Set(['startDate', 'dueDate', 'createdAt', 'closedAt']),
  debtPayments: new Set(['date', 'createdAt']),
  accountCashbacks: new Set(['startDate', 'endDate']),
}

function reviver(tableName: string) {
  const dateFields = DATE_FIELDS[tableName]
  if (!dateFields) return (_: string, v: unknown) => v
  return (_key: string, value: unknown) => {
    if (dateFields.has(_key) && typeof value === 'string') {
      const parsed = new Date(value)
      if (!isNaN(parsed.getTime())) return parsed
    }
    return value
  }
}

export async function exportData(): Promise<string> {
  const dump: Record<string, unknown[]> = {}

  for (const name of TABLE_NAMES) {
    dump[name] = await (db as any)[name].toArray()
  }

  return JSON.stringify(dump, null, 2)
}

export async function importData(json: string): Promise<void> {
  const dump: Record<string, unknown[]> = JSON.parse(json)

  for (const name of TABLE_NAMES) {
    if (!Array.isArray(dump[name])) {
      throw new Error(`Invalid dump: missing or invalid table "${name}"`)
    }
  }

  await db.transaction('rw', TABLE_NAMES.map((n) => (db as any)[n]), async () => {
    for (const name of TABLE_NAMES) {
      await (db as any)[name].clear()
    }

    for (const name of TABLE_NAMES) {
      const data = dump[name].map((item) =>
        JSON.parse(JSON.stringify(item), reviver(name))
      )
      if (data.length > 0) {
        await (db as any)[name].bulkAdd(data)
      }
    }
  })
}