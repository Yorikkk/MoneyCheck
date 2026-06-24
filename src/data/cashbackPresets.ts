export interface CashbackPresetItem {
  name: string
  categoryName?: string
  mccList?: number[]
}

export interface CashbackPreset {
  bankName: string
  items: CashbackPresetItem[]
}

export const CASHBACK_PRESETS: CashbackPreset[] = [
  {
    bankName: 'Сбербанк',
    items: [
      { name: 'Рестораны', categoryName: 'Кафе', mccList: [5811, 5812, 5813, 5814] },
      { name: 'Продукты', categoryName: 'Продукты', mccList: [5411, 5422, 5431, 5441, 5451, 5462, 5499] },
      { name: 'АЗС', categoryName: 'Транспорт', mccList: [5172, 5541, 5542, 5983] },
      { name: 'Аптеки', categoryName: 'Здоровье', mccList: [5122, 5912] },
      { name: 'Одежда и обувь', categoryName: 'Одежда', mccList: [5611, 5621, 5631, 5641, 5651, 5655, 5661, 5691, 5699] },
      { name: 'Транспорт', categoryName: 'Транспорт', mccList: [4011, 4111, 4112, 4121, 4131, 4511, 4789] },
      { name: 'Развлечения', categoryName: 'Развлечения', mccList: [7832, 7841, 7911, 7922, 7929, 7932, 7933, 7941, 7991, 7996, 7997, 7998] },
      { name: 'Дом и ремонт', categoryName: 'Жильё', mccList: [1520, 1711, 1731, 1741, 1750, 1761, 1771, 5211, 5231, 5251, 5261, 5712, 5713, 5714, 5718, 5719, 5722, 5734] },
      { name: 'Цветы', categoryName: 'Подарки', mccList: [5992] },
      { name: 'Зоотовары', categoryName: 'Прочее', mccList: [742, 5995] },
    ],
  },
  {
    bankName: 'Т-Банк',
    items: [
      { name: 'Рестораны', categoryName: 'Кафе', mccList: [5811, 5812, 5813, 5814] },
      { name: 'АЗС', categoryName: 'Транспорт', mccList: [5172, 5541, 5542, 5983] },
      { name: 'Такси', categoryName: 'Транспорт', mccList: [4121] },
      { name: 'Авиабилеты', categoryName: 'Транспорт', mccList: [3000, 3001, 3002, 3033, 3052, 3351, 3352, 3353, 3354, 3355, 3357, 3359, 3360, 3361, 4511] },
      { name: 'Отели', categoryName: 'Жильё', mccList: [3501, 3502, 3503, 3504, 3505, 3506, 3507, 3508, 3509, 3510, 3511, 3512, 3513, 3514, 3515, 3516, 3517, 3518, 3519, 7011, 7012] },
      { name: 'Кино', categoryName: 'Развлечения', mccList: [7832, 7841, 7829] },
      { name: 'Аптеки', categoryName: 'Здоровье', mccList: [5122, 5912] },
      { name: 'Супермаркеты', categoryName: 'Продукты', mccList: [5411, 5422, 5431, 5441, 5451, 5462, 5499] },
      { name: 'Образование', categoryName: 'Образование', mccList: [8211, 8220, 8241, 8244, 8249, 8299, 8351] },
      { name: 'Спорт и фитнес', categoryName: 'Здоровье', mccList: [5941, 7992, 7997] },
    ],
  },
  {
    bankName: 'Альфа-Банк',
    items: [
      { name: 'Рестораны', categoryName: 'Кафе', mccList: [5811, 5812, 5813, 5814] },
      { name: 'Такси', categoryName: 'Транспорт', mccList: [4121] },
      { name: 'АЗС', categoryName: 'Транспорт', mccList: [5172, 5541, 5542] },
      { name: 'Аптеки', categoryName: 'Здоровье', mccList: [5122, 5912] },
      { name: 'Супермаркеты', categoryName: 'Продукты', mccList: [5411, 5422, 5431, 5441, 5451, 5462, 5499] },
      { name: 'Одежда', categoryName: 'Одежда', mccList: [5611, 5621, 5631, 5641, 5651, 5655, 5661, 5691] },
      { name: 'Развлечения', categoryName: 'Развлечения', mccList: [7832, 7841, 7911, 7922, 7929, 7996] },
      { name: 'Путешествия', categoryName: 'Транспорт', mccList: [3000, 3001, 3002, 4511, 4722, 7011] },
      { name: 'Красота', categoryName: 'Прочее', mccList: [5977, 7230, 7251, 7298] },
    ],
  },
  {
    bankName: 'ВТБ',
    items: [
      { name: 'Рестораны', categoryName: 'Кафе', mccList: [5811, 5812, 5813, 5814] },
      { name: 'АЗС', categoryName: 'Транспорт', mccList: [5172, 5541, 5542] },
      { name: 'Аптеки', categoryName: 'Здоровье', mccList: [5122, 5912] },
      { name: 'Супермаркеты', categoryName: 'Продукты', mccList: [5411, 5422, 5431, 5441, 5451, 5462, 5499] },
      { name: 'Одежда', categoryName: 'Одежда', mccList: [5611, 5621, 5631, 5641, 5651] },
      { name: 'Транспорт', categoryName: 'Транспорт', mccList: [4011, 4111, 4112, 4121, 4131] },
      { name: 'Детские товары', categoryName: 'Подарки', mccList: [5641, 5945] },
      { name: 'Зоотовары', categoryName: 'Прочее', mccList: [742, 5995] },
      { name: 'Спорт', categoryName: 'Здоровье', mccList: [5941, 7992, 7997] },
    ],
  },
  {
    bankName: 'Газпромбанк',
    items: [
      { name: 'АЗС', categoryName: 'Транспорт', mccList: [5172, 5541, 5542] },
      { name: 'Рестораны', categoryName: 'Кафе', mccList: [5811, 5812, 5813] },
      { name: 'Аптеки', categoryName: 'Здоровье', mccList: [5122, 5912] },
      { name: 'Супермаркеты', categoryName: 'Продукты', mccList: [5411, 5422, 5431, 5441, 5451, 5462, 5499] },
      { name: 'Транспорт', categoryName: 'Транспорт', mccList: [4011, 4111, 4112, 4121, 4131] },
      { name: 'Одежда', categoryName: 'Одежда', mccList: [5611, 5621, 5631, 5641, 5651] },
      { name: 'Дом', categoryName: 'Жильё', mccList: [1520, 1711, 1731, 1741, 1750, 1761, 5211, 5231, 5251, 5261, 5712] },
    ],
  },
  {
    bankName: 'Почта Банк',
    items: [
      { name: 'Рестораны', categoryName: 'Кафе', mccList: [5811, 5812, 5813] },
      { name: 'АЗС', categoryName: 'Транспорт', mccList: [5172, 5541, 5542] },
      { name: 'Аптеки', categoryName: 'Здоровье', mccList: [5122, 5912] },
      { name: 'Супермаркеты', categoryName: 'Продукты', mccList: [5411, 5422, 5431, 5441, 5451, 5462, 5499] },
      { name: 'Дом и ремонт', categoryName: 'Жильё', mccList: [1520, 1711, 1731, 5211, 5231, 5251, 5261, 5712] },
      { name: 'Связь', categoryName: 'Связь', mccList: [4812, 4814, 4816, 4821, 4829, 4899] },
    ],
  },
]

function hashCashbackPresets(): string {
  let hash = 5381
  const str = JSON.stringify(CASHBACK_PRESETS)
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
  }
  return Math.abs(hash).toString(36)
}

export const CASHBACK_PRESETS_HASH = hashCashbackPresets()