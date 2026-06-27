import { create } from 'zustand'

export type FilterType = 'all' | 'income' | 'expense' | 'transfer'
export type DatePreset = 'month' | 'lastMonth' | '90days' | 'year' | 'lastYear' | 'custom'

interface TransactionFiltersState {
  filterAccount: number | null
  filterType: FilterType
  datePreset: DatePreset
  customDateFrom: string
  customDateTo: string
  setFilterAccount: (id: number | null) => void
  setFilterType: (t: FilterType) => void
  setDatePreset: (p: DatePreset) => void
  setCustomDateFrom: (d: string) => void
  setCustomDateTo: (d: string) => void
}

export const useTransactionFiltersStore = create<TransactionFiltersState>((set) => ({
  filterAccount: null,
  filterType: 'all',
  datePreset: 'month',
  customDateFrom: '',
  customDateTo: '',
  setFilterAccount: (id) => set({ filterAccount: id }),
  setFilterType: (t) => set({ filterType: t }),
  setDatePreset: (p) => set({ datePreset: p }),
  setCustomDateFrom: (d) => set({ customDateFrom: d }),
  setCustomDateTo: (d) => set({ customDateTo: d }),
}))