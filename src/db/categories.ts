import { db, type Category } from './db'

export async function getCategories(parentId?: number | null, type?: 'income' | 'expense') {
  let collection = db.categories.orderBy('order')
  collection = collection.filter((c) => c.parentId === (parentId ?? undefined)) as typeof collection
  if (type) {
    collection = collection.filter((c) => c.type === type) as typeof collection
  }
  return collection.toArray()
}

export async function getCategoryTree(type?: 'income' | 'expense'): Promise<Category[]> {
  let collection = db.categories.orderBy('order')
  if (type) {
    collection = collection.filter((c) => c.type === type) as typeof collection
  }
  return collection.toArray()
}

export async function hasSubcategories(id: number): Promise<boolean> {
  const count = await db.categories.where('parentId').equals(id).count()
  return count > 0
}

export async function addCategory(category: Omit<Category, 'id'>) {
  return db.categories.add(category)
}

export async function updateCategory(id: number, changes: Partial<Category>) {
  return db.categories.update(id, changes)
}

export async function deleteCategory(id: number) {
  const subs = await db.categories.where('parentId').equals(id).toArray()
  for (const sub of subs) {
    await db.categories.delete(sub.id!)
  }
  return db.categories.delete(id)
}