import { db } from './db'
import { CASHBACK_PRESETS } from '@/data/cashbackPresets'
import { simpleHash } from '@/lib/utils'

const EXPENSE_CATEGORIES = [
  { name: 'Супермаркеты', icon: '🛒', color: '#4CAF50', order: 1 },
  { name: 'Коммуналка', icon: '🏠', color: '#FF9800', order: 2 },
  { name: 'Общепит', icon: '🍽️', color: '#FF5722', order: 3 },
  { name: 'Транспорт', icon: '🚗', color: '#2196F3', order: 4 },
  { name: 'Авто', icon: '🚘', color: '#2196F3', order: 4 },
  { name: 'Развлечения', icon: '🎬', color: '#E91E63', order: 5 },
  { name: 'Подписки', icon: '🔔', color: '#cfdf42', order: 6 },
  { name: 'Здоровье', icon: '💊', color: '#F44336', order: 7 },
  { name: 'Одежда', icon: '👕', color: '#9C27B0', order: 8 },
  { name: 'Образование', icon: '📚', color: '#3F51B5', order: 9 },
  { name: 'Путешествия', icon: '✈️', color: '#1e43e9', order: 10, },
  { name: 'Семья', icon: '👨‍👩‍👧‍👦', color: '#1ee92f', order: 11, },
  { name: 'Подарки', icon: '🎁', color: '#E91E63', order: 12, mcc: 5947 },
  { name: 'Прочее', icon: '📦', color: '#9E9E9E', order: 13 },
]

const INCOME_CATEGORIES = [
  { name: 'Зарплата', icon: '💼', color: '#4CAF50', order: 1, mcc: 6010 },
  { name: 'Кешбек', icon: '💸', color: '#27b027', order: 2 },
  { name: 'Проценты', icon: '📈', color: '#9C27B0', order: 3, mcc: 6012 },
  { name: 'Подработка', icon: '🔧', color: '#FF9800', order: 4 },
  { name: 'Возврат', icon: '🔙', color: '#FF9800', order: 4 },
  { name: 'Прочее', icon: '💰', color: '#607D8B', order: 5 },
]

const SUBCATEGORIES: Record<string, { name: string; icon: string; color: string; mcc?: number }[]> = {
  'Супермаркеты': [
    { name: 'Пятёрочка', icon: '🏪', color: '#009845', mcc: 5411 },
    { name: 'Перекрёсток', icon: '🏪', color: '#005B00', mcc: 5411 },
    { name: 'Чижик', icon: '🏪', color: '#d2e716', mcc: 5411 },
    { name: 'Ашан', icon: '🏪', color: '#0051A0', mcc: 5411 },
    { name: 'Сыр да масло', icon: '🏪', color: '#2E7D32', mcc: 5499 },
    { name: 'Магнит', icon: '🏪', color: '#E53935', mcc: 5411 },
    { name: 'Красное и белое', icon: '🏪', color: '#f30a0a', mcc: 5411 },
    { name: 'Магазин', icon: '🏪', color: '#9E9E9E', mcc: 5411 },
    { name: 'Рынок', icon: '🏪', color: '#2E7D32', mcc: 5422 },
  ],
  'Коммуналка': [
    { name: 'Квартплата', icon: '🏢', color: '#E65100' },
    { name: 'Телефон', icon: '💡', color: '#F57C00' },
    { name: 'Интернет', icon: '🌐', color: '#455A64', mcc: 4814 },
    { name: 'Телефон', icon: '📱', color: '#546E7A', mcc: 4814 },
  ],
  'Общепит': [
    { name: 'Обеды', icon: '🍱', color: '#FF7043', mcc: 5812 },
    { name: 'Кофе', icon: '☕', color: '#8D6E63', mcc: 5812 },
    { name: 'Рестораны', icon: '🍜', color: '#BF360C', mcc: 5812 },
    { name: 'Фастфуд', icon: '🍔', color: '#bfb30c', mcc: 5814 },
  ],
  'Транспорт': [
    { name: 'Такси', icon: '🚕', color: '#FFC107', mcc: 4121 },
    { name: 'Метро', icon: '🚇', color: '#FF5722', mcc: 4111 },
    { name: 'Автобус', icon: '🚌', color: '#FF9800', mcc: 4111 },
    { name: 'ЖД', icon: '🚂', color: '#ff0800', mcc: 4490 },
    { name: 'Электричка', icon: '🚅', color: '#00e1ff', mcc: 4111 },
    { name: 'Бензин', icon: '⛽', color: '#F44336', mcc: 5541 },
  ],
  'Развлечения': [
    { name: 'Кино', icon: '🎬', color: '#E91E63', mcc: 7832 },
    { name: 'Игры', icon: '🎮', color: '#9C27B0', mcc: 7993 },
  ],
  'Подписки': [
    { name: 'ВПН', icon: '🌐', color: '#22c8d4' },
    { name: 'Банки', icon: '🏛️', color: '#607580' },
    { name: 'Кино', icon: '🎥', color: '#0f0f0f' },
    { name: 'Проги', icon: '📋', color: '#545b5e' },
  ],
  'Здоровье': [
    { name: 'Аптека', icon: '💊', color: '#EF5350', mcc: 5912 },
    { name: 'Врачи', icon: '🩺', color: '#EC407A', mcc: 8011 },
    { name: 'Спорт', icon: '🏋️', color: '#AB47BC', mcc: 7997 },
  ],
  'Путешествия': [
    { name: 'Отпуск', icon: '⛵', color: '#9fd422' },
    { name: 'Поездки', icon: '🚌', color: '#1ea9e9' },
  ],
  'Семья': [
    { name: 'Яся', icon: '👧🏽', color: '#5a5a42' },
    { name: 'Лиля', icon: '👩🏻‍🦰', color: '#e95e1e' },
    { name: 'Эля', icon: '👸🏻', color: '#240229' },
    { name: 'Родственники', icon: '👨‍👩‍👧‍👦', color: '#8bb6ee' },
  ],
}

export async function seedDefaults() {
  if (await db.accountTypes.count() === 0) {
    await db.accountTypes.bulkAdd([
      { name: 'Дебетовая карта', icon: '💵', color: '#4CAF50', order: 1, kind: 'regular' },
      { name: 'Срочный счёт', icon: '🏦', color: '#21bb55', order: 2, kind: 'regular' },
      { name: 'Накопительный счёт', icon: '🏦', color: '#0bf16b', order: 3, kind: 'regular' },
      { name: 'Кредитная карта', icon: '💳', color: '#FF9800', order: 4, kind: 'credit' },
      { name: 'Ипотека', icon: '🏠', color: '#9C27B0', order: 5, kind: 'mortgage' },
      { name: 'Кредит', icon: '📋', color: '#f7a000', order: 6, kind: 'credit' },
      { name: 'Наличные', icon: '💵', color: '#4CAF50', order: 7, kind: 'regular' },
    ])
  }

  const ALL_BANKS = [
    { name: 'Сбербанк', icon: '🏦', color: '#1D8A3E', order: 1 },
    { name: 'Т-Банк', icon: '💳', color: '#FFDD2D', order: 2 },
    { name: 'Альфа-Банк', icon: '🔴', color: '#EF3124', order: 3 },
    { name: 'ВТБ', icon: '🔵', color: '#003F7D', order: 4 },
    { name: 'Газпромбанк', icon: '🏛️', color: '#003D7A', order: 5 },
    { name: 'Почта Банк', icon: '📮', color: '#FF6600', order: 6 },
    { name: 'Озон Банк', icon: '🛒', color: '#005BFF', order: 7 },
    { name: 'Яндекс Банк', icon: '💎', color: '#FC3F1D', order: 8 },
    { name: 'МТС Банк', icon: '📱', color: '#E30613', order: 9 },
    { name: 'Финуслуги', icon: '⚖️', color: '#0047AB', order: 10 },
  ]
  for (const bank of ALL_BANKS) {
    const existing = await db.banks.where('name').equals(bank.name).first()
    if (!existing) {
      await db.banks.add(bank)
    }
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

  const savedHash = localStorage.getItem('cashback_presets_hash')
  const currentHash = simpleHash(JSON.stringify(CASHBACK_PRESETS))
  if (savedHash !== currentHash) {
    await seedCashbackPresets()
    localStorage.setItem('cashback_presets_hash', currentHash)
  }

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