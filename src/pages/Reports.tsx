import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { useAllTransactions, useCategories, useAccounts, useBanks, useAccountTypes } from '@/hooks/useDb'
import { ExpenseStructureSection } from '@/components/reports/ExpenseStructureSection'
import { IncomeStructureSection } from '@/components/reports/IncomeStructureSection'
import { CashbackSection } from '@/components/reports/CashbackSection'
import { InvestmentTransfersSection } from '@/components/reports/InvestmentTransfersSection'
import { IncomeExpenseSection } from '@/components/reports/IncomeExpenseSection'

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

type PeriodType = 'month' | 'quarter' | 'year'

const PERIOD_LABELS: Record<PeriodType, string> = {
  month: 'месяц',
  quarter: 'квартал',
  year: 'год',
}

const PERIODS: { type: PeriodType; label: string }[] = [
  { type: 'month', label: 'Месяц' },
  { type: 'quarter', label: 'Квартал' },
  { type: 'year', label: 'Год' },
]

export default function Reports() {
  const now = dayjs()
  const [period, setPeriod] = useState<PeriodType>('month')
  const [offset, setOffset] = useState(0)
  const allTx = useAllTransactions() ?? []
  const categories = useCategories() ?? []
  const accounts = useAccounts() ?? []
  const banks = useBanks() ?? []
  const accountTypes = useAccountTypes() ?? []

  const months = useMemo(() => {
    const result: { month: number; year: number; label: string }[] = []
    if (period === 'quarter') {
      const anchor = now.subtract(offset * 3, 'month')
      const startMonth = Math.floor(anchor.month() / 3) * 3
      for (let i = 0; i < 3; i++) {
        const d = anchor.month(startMonth + i)
        result.push({
          month: d.month() + 1,
          year: d.year(),
          label: `${MONTHS[d.month()]} ${String(d.year()).slice(2)}`,
        })
      }
    } else if (period === 'year') {
      const anchor = now.subtract(offset, 'year')
      for (let i = 0; i < 12; i++) {
        const d = anchor.month(i)
        result.push({
          month: d.month() + 1,
          year: d.year(),
          label: `${MONTHS[d.month()]} ${String(d.year()).slice(2)}`,
        })
      }
    } else {
      const d = now.subtract(offset, 'month')
      result.push({
        month: d.month() + 1,
        year: d.year(),
        label: `${MONTHS[d.month()]} ${String(d.year()).slice(2)}`,
      })
    }
    return result
  }, [period, offset])

  const dateFrom = dayjs(`${months[0].year}-${months[0].month}-01`).format('YYYY-MM-DD')
  const dateTo = dayjs(`${months[months.length - 1].year}-${months[months.length - 1].month}-01`).endOf('month').format('YYYY-MM-DD')

  const periodTx = useMemo(() => {
    return allTx.filter((t) => {
      const d = dayjs(t.date)
      return months.some((m) => d.month() + 1 === m.month && d.year() === m.year)
    })
  }, [allTx, months])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Отчёты</h1>

      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.type}
            onClick={() => { setPeriod(p.type); setOffset(0) }}
            className={`flex-1 py-2 text-sm rounded-lg ${period === p.type ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 shadow-sm'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOffset((o) => o + 1)}
          className="w-8 h-8 shrink-0 rounded-full bg-white text-gray-600 shadow-sm hover:text-blue-600 flex items-center justify-center"
          aria-label="Предыдущий период"
        >
          ‹
        </button>
        <div className="flex items-center gap-2 flex-1">
          <input
            type="date"
            value={dateFrom}
            readOnly
            className="w-full text-sm px-2 py-2 rounded-lg bg-white text-gray-600 shadow-sm border-none"
          />
          <span className="text-gray-400 text-sm shrink-0">—</span>
          <input
            type="date"
            value={dateTo}
            readOnly
            className="w-full text-sm px-2 py-2 rounded-lg bg-white text-gray-600 shadow-sm border-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setOffset((o) => o - 1)}
          disabled={offset === 0}
          className="w-8 h-8 shrink-0 rounded-full bg-white text-gray-600 shadow-sm hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-600 flex items-center justify-center"
          aria-label="Следующий период"
        >
          ›
        </button>
      </div>

      <IncomeExpenseSection transactions={periodTx} months={months} />

      <ExpenseStructureSection
        transactions={periodTx}
        categories={categories}
        accounts={accounts}
        banks={banks}
        periodLabel={PERIOD_LABELS[period]}
      />

      <IncomeStructureSection
        transactions={periodTx}
        categories={categories}
        accounts={accounts}
        banks={banks}
        periodLabel={PERIOD_LABELS[period]}
      />

      <CashbackSection
        transactions={periodTx}
        categories={categories}
        accounts={accounts}
        banks={banks}
        periodLabel={PERIOD_LABELS[period]}
      />

      <InvestmentTransfersSection
        transactions={periodTx}
        accounts={accounts}
        banks={banks}
        accountTypes={accountTypes}
        periodLabel={PERIOD_LABELS[period]}
      />
    </div>
  )
}