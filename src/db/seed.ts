import { db } from './db'

const EXPENSE_CATEGORIES = [
  { name: 'Продукты', icon: '🛒', color: '#4CAF50', order: 1, mcc: 5411 },
  { name: 'Транспорт', icon: '🚗', color: '#2196F3', order: 2, mcc: 4121 },
  { name: 'Жильё', icon: '🏠', color: '#FF9800', order: 3, mcc: 6513 },
  { name: 'Развлечения', icon: '🎬', color: '#E91E63', order: 4, mcc: 7996 },
  { name: 'Здоровье', icon: '💊', color: '#F44336', order: 5, mcc: 8099 },
  { name: 'Одежда', icon: '👕', color: '#9C27B0', order: 6, mcc: 5651 },
  { name: 'Связь', icon: '📱', color: '#607D8B', order: 7, mcc: 4814 },
  { name: 'Образование', icon: '📚', color: '#3F51B5', order: 8, mcc: 8299 },
  { name: 'Кафе', icon: '🍽️', color: '#FF5722', order: 9, mcc: 5812 },
  { name: 'Подарки', icon: '🎁', color: '#E91E63', order: 10, mcc: 5947 },
  { name: 'Проценты', icon: '📊', color: '#795548', order: 11, mcc: 6012 },
  { name: 'Прочее', icon: '📦', color: '#9E9E9E', order: 12 },
]

const INCOME_CATEGORIES = [
  { name: 'Зарплата', icon: '💼', color: '#4CAF50', order: 1, mcc: 6010 },
  { name: 'Фриланс', icon: '💻', color: '#2196F3', order: 2 },
  { name: 'Подработка', icon: '🔧', color: '#FF9800', order: 3 },
  { name: 'Проценты', icon: '📈', color: '#9C27B0', order: 4, mcc: 6012 },
  { name: 'Прочее', icon: '💰', color: '#607D8B', order: 5 },
]

const SUBCATEGORIES: Record<string, { name: string; icon: string; color: string; mcc?: number }[]> = {
  'Продукты': [
    { name: 'Пятёрочка', icon: '🏪', color: '#66BB6A', mcc: 5411 },
    { name: 'Перекрёсток', icon: '🏪', color: '#43A047', mcc: 5411 },
    { name: 'Ашан', icon: '🏪', color: '#388E3C', mcc: 5411 },
    { name: 'Рынок', icon: '🏪', color: '#2E7D32', mcc: 5422 },
    { name: 'Магнит', icon: '🏪', color: '#E53935', mcc: 5411 },
  ],
  'Транспорт': [
    { name: 'Такси', icon: '🚕', color: '#FFC107', mcc: 4121 },
    { name: 'Метро', icon: '🚇', color: '#FF5722', mcc: 4111 },
    { name: 'Автобус', icon: '🚌', color: '#FF9800', mcc: 4111 },
    { name: 'Бензин', icon: '⛽', color: '#F44336', mcc: 5541 },
  ],
  'Кафе': [
    { name: 'Обеды', icon: '🍱', color: '#FF7043', mcc: 5812 },
    { name: 'Кофе', icon: '☕', color: '#8D6E63', mcc: 5812 },
    { name: 'Рестораны', icon: '🍜', color: '#BF360C', mcc: 5812 },
  ],
  'Здоровье': [
    { name: 'Аптека', icon: '💊', color: '#EF5350', mcc: 5912 },
    { name: 'Врачи', icon: '🩺', color: '#EC407A', mcc: 8011 },
    { name: 'Спорт', icon: '🏋️', color: '#AB47BC', mcc: 7997 },
  ],
  'Развлечения': [
    { name: 'Кино', icon: '🎬', color: '#E91E63', mcc: 7832 },
    { name: 'Игры', icon: '🎮', color: '#9C27B0', mcc: 7993 },
    { name: 'Подписки', icon: '📺', color: '#673AB7', mcc: 4899 },
  ],
  'Связь': [
    { name: 'Интернет', icon: '🌐', color: '#455A64', mcc: 4814 },
    { name: 'Телефон', icon: '📱', color: '#546E7A', mcc: 4814 },
  ],
  'Одежда': [
    { name: 'Обувь', icon: '👟', color: '#7B1FA2', mcc: 5661 },
    { name: 'Одежда', icon: '👕', color: '#8E24AA', mcc: 5651 },
    { name: 'Аксессуары', icon: '🎒', color: '#6A1B9A', mcc: 5947 },
  ],
  'Жильё': [
    { name: 'Аренда', icon: '🏢', color: '#E65100', mcc: 6513 },
    { name: 'Коммуналка', icon: '💡', color: '#F57C00', mcc: 4900 },
    { name: 'Ремонт', icon: '🔧', color: '#EF6C00', mcc: 5211 },
  ],
}

export async function seedDefaults() {
  const accountTypesCount = await db.accountTypes.count()
  if (accountTypesCount > 0) return

  await db.accountTypes.bulkAdd([
    { name: 'Наличные', icon: '💵', color: '#4CAF50', order: 1, isLoan: false },
    { name: 'Банковский счёт', icon: '🏦', color: '#2196F3', order: 2, isLoan: false },
    { name: 'Кредитная карта', icon: '💳', color: '#FF9800', order: 3, isLoan: true },
    { name: 'Ипотека', icon: '🏠', color: '#9C27B0', order: 4, isLoan: true },
    { name: 'Кредит', icon: '📋', color: '#F44336', order: 5, isLoan: true },
  ])

  const categoryCount = await db.categories.count()
  if (categoryCount > 0) return

  const nameToId: Record<string, number> = {}

  for (let i = 0; i < EXPENSE_CATEGORIES.length; i++) {
    const id = await db.categories.add({ ...EXPENSE_CATEGORIES[i], type: 'expense', parentId: undefined })
    nameToId[EXPENSE_CATEGORIES[i].name] = id!
  }

  for (let i = 0; i < INCOME_CATEGORIES.length; i++) {
    const id = await db.categories.add({ ...INCOME_CATEGORIES[i], type: 'income', parentId: undefined })
    nameToId[INCOME_CATEGORIES[i].name] = id!
  }

  const subData: {
    name: string; icon: string; color: string; mcc?: number; type: 'expense'; parentId: number; order: number
  }[] = []
  for (const [parentName, subs] of Object.entries(SUBCATEGORIES)) {
    const parentId = nameToId[parentName]
    if (!parentId) continue
    subs.forEach((s, i) => {
      subData.push({ ...s, type: 'expense', parentId, order: i + 1 })
    })
  }
  if (subData.length > 0) {
    await db.categories.bulkAdd(subData)
  }

  const familyCount = await db.familyMembers.count()
  if (familyCount > 0) return

  await db.familyMembers.add({ name: 'Я', color: '#2196F3' })
}