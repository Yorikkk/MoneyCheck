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
  return db.familyMembers.delete(id)
}