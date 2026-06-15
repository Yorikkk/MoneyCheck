import { db, type Category } from './db'

export async function getCategories(type?: 'income' | 'expense') {
  let collection = db.categories.orderBy('order')
  if (type) {
    collection = collection.filter((c) => c.type === type) as typeof collection
  }
  return collection.toArray()
}

export async function addCategory(category: Omit<Category, 'id'>) {
  return db.categories.add(category)
}

export async function updateCategory(id: number, changes: Partial<Category>) {
  return db.categories.update(id, changes)
}

export async function deleteCategory(id: number) {
  return db.categories.delete(id)
}