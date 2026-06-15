import { db } from './db'

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

  const categoriesCount = await db.categories.count()
  if (categoriesCount > 0) return

  await db.categories.bulkAdd([
    { name: 'Продукты', icon: '🛒', color: '#4CAF50', type: 'expense', order: 1 },
    { name: 'Транспорт', icon: '🚗', color: '#2196F3', type: 'expense', order: 2 },
    { name: 'Жильё', icon: '🏠', color: '#FF9800', type: 'expense', order: 3 },
    { name: 'Развлечения', icon: '🎬', color: '#E91E63', type: 'expense', order: 4 },
    { name: 'Здоровье', icon: '💊', color: '#F44336', type: 'expense', order: 5 },
    { name: 'Одежда', icon: '👕', color: '#9C27B0', type: 'expense', order: 6 },
    { name: 'Связь', icon: '📱', color: '#607D8B', type: 'expense', order: 7 },
    { name: 'Образование', icon: '📚', color: '#3F51B5', type: 'expense', order: 8 },
    { name: 'Кафе', icon: '🍽️', color: '#FF5722', type: 'expense', order: 9 },
    { name: 'Подарки', icon: '🎁', color: '#E91E63', type: 'expense', order: 10 },
    { name: 'Проценты', icon: '📊', color: '#795548', type: 'expense', order: 11 },
    { name: 'Прочее', icon: '📦', color: '#9E9E9E', type: 'expense', order: 12 },
    { name: 'Зарплата', icon: '💼', color: '#4CAF50', type: 'income', order: 1 },
    { name: 'Фриланс', icon: '💻', color: '#2196F3', type: 'income', order: 2 },
    { name: 'Подработка', icon: '🔧', color: '#FF9800', type: 'income', order: 3 },
    { name: 'Проценты', icon: '📈', color: '#9C27B0', type: 'income', order: 4 },
    { name: 'Прочее', icon: '💰', color: '#607D8B', type: 'income', order: 5 },
  ])

  const familyCount = await db.familyMembers.count()
  if (familyCount > 0) return

  await db.familyMembers.add({ name: 'Я', color: '#2196F3' })
}