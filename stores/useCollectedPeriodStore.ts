import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CollectedPeriod } from '@/types/collected-period'

interface CollectedPeriodStore {
  periods: CollectedPeriod[]
  addPeriod: (period: CollectedPeriod) => void
  updatePeriod: (id: string, updates: Partial<CollectedPeriod>) => void
  deletePeriod: (id: string) => void
  getPeriodsByPlantAndMachine: (plant: string, machineNo: string) => CollectedPeriod[]
  clearAllPeriods: () => void
}

export const useCollectedPeriodStore = create<CollectedPeriodStore>()(
  persist(
    (set, get) => ({
      periods: [],

      addPeriod: (period) => {
        set((state) => ({
          periods: [...state.periods, period]
        }))
      },

      updatePeriod: (id, updates) => {
        set((state) => ({
          periods: state.periods.map(p => 
            p.id === id ? { ...p, ...updates } : p
          )
        }))
      },

      deletePeriod: (id) => {
        set((state) => ({
          periods: state.periods.filter(p => p.id !== id)
        }))
      },

      getPeriodsByPlantAndMachine: (plant, machineNo) => {
        const { periods } = get()
        return periods.filter(p => 
          p.plant === plant && p.machineNo === machineNo
        )
      },

      clearAllPeriods: () => {
        set({ periods: [] })
      }
    }),
    {
      name: 'collected-periods-storage',
      version: 1,
    }
  )
)