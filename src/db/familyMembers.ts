import { db, type FamilyMember } from './db'

export async function getFamilyMembers() {
  return db.familyMembers.toArray()
}

export async function addFamilyMember(member: Omit<FamilyMember, 'id'>) {
  return db.familyMembers.add(member)
}

export async function updateFamilyMember(id: number, changes: Partial<FamilyMember>) {
  return db.familyMembers.update(id, changes)
}

export async function deleteFamilyMember(id: number) {
  const [accountsCount, debtsCount, transactionsCount] = await Promise.all([
    db.accounts.where('familyMemberId').equals(id).count(),
    db.debts.where('familyMemberId').equals(id).count(),
    db.transactions.where('familyMemberId').equals(id).count(),
  ])
  if (accountsCount > 0 || debtsCount > 0 || transactionsCount > 0) {
    const parts: string[] = []
    if (accountsCount > 0) parts.push(`${accountsCount} счет(ов)`)
    if (debtsCount > 0) parts.push(`${debtsCount} долг(ов)`)
    if (transactionsCount > 0) parts.push(`${transactionsCount} транзакци(й)`)
    throw new Error(`Нельзя удалить члена семьи: привязан к ${parts.join(', ')}`)
  }
  return db.familyMembers.delete(id)
}