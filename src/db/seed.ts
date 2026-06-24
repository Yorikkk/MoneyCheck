import { db } from './db'
import { CASHBACK_PRESETS } from '@/data/cashbackPresets'

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
  if (await db.accountTypes.count() === 0) {
    await db.accountTypes.bulkAdd([
      { name: 'Наличные', icon: '💵', color: '#4CAF50', order: 1, kind: 'regular' },
      { name: 'Банковский счёт', icon: '🏦', color: '#2196F3', order: 2, kind: 'regular' },
      { name: 'Кредитная карта', icon: '💳', color: '#FF9800', order: 3, kind: 'credit' },
      { name: 'Ипотека', icon: '🏠', color: '#9C27B0', order: 4, kind: 'mortgage' },
      { name: 'Кредит', icon: '📋', color: '#F44336', order: 5, kind: 'credit' },
    ])
  }

  if (await db.banks.count() === 0) {
    await db.banks.bulkAdd([
      { name: 'Сбербанк', icon: '🟢', color: '#4CAF50', order: 1 },
      { name: 'Т-Банк', icon: '💛', color: '#FFD700', order: 2 },
      { name: 'Альфа-Банк', icon: '🔴', color: '#F44336', order: 3 },
      { name: 'ВТБ', icon: '🔵', color: '#2196F3', order: 4 },
      { name: 'Газпромбанк', icon: '🟣', color: '#9C27B0', order: 5 },
      { name: 'Почта Банк', icon: '🟠', color: '#FF9800', order: 6 },
      { name: 'Озон Банк', icon: '🛒', color: '#005BFF', order: 7 },
      { name: 'Яндекс Банк', icon: '🧾', color: '#FC3F1D', order: 8 },
      { name: 'МТС Банк', icon: '📶', color: '#E30613', order: 9 },
      { name: 'Финуслуги', icon: '🏛️', color: '#0047AB', order: 10 },
    ])
  }

  const categoryCount = await db.categories.count()
  if (categoryCount === 0) {
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
  }

  await seedCashbackPresets()

  if (await db.familyMembers.count() === 0) {
    await db.familyMembers.add({ name: 'Я', color: '#2196F3' })
  }
}

export async function seedCashbackPresets() {
  const categoryMap = new Map<string, number>()
  for (const cat of await db.categories.toArray()) {
    if (cat.id) categoryMap.set(cat.name, cat.id)
  }

  for (const preset of CASHBACK_PRESETS) {
    const bank = await db.banks.where('name').equals(preset.bankName).first()
    if (!bank || !bank.id) continue

    for (const item of preset.items) {
      const existing = await db.cashbacks.where({ bankId: bank.id, name: item.name }).first()

      const data = {
        bankId: bank.id,
        name: item.name,
        mccList: item.mccList,
      }

      if (existing && existing.id) {
        await db.cashbacks.update(existing.id, data)
      } else {
        await db.cashbacks.add(data)
      }
    }
  }
}