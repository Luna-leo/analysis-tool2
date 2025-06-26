import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Represents a single input history item
 */
interface InputHistoryItem {
  value: string
  count: number
  lastUsed: string
}

/**
 * Input history store state and actions
 */
interface InputHistoryState {
  // State
  plantHistory: InputHistoryItem[]
  machineHistory: InputHistoryItem[]
  
  // Actions
  addPlantHistory: (plant: string) => void
  addMachineHistory: (machine: string) => void
  getPlantSuggestions: () => string[]
  getMachineSuggestions: () => string[]
  clearHistory: () => void
  clearPlantHistory: () => void
  clearMachineHistory: () => void
}

const MAX_HISTORY_ITEMS = 20

/**
 * Generic function to add an item to history
 * Handles updating existing items or adding new ones
 */
const addToHistory = (
  history: InputHistoryItem[],
  value: string
): InputHistoryItem[] => {
  if (!value.trim()) return history
  
  const existing = history.find(item => item.value === value)
  let newHistory: InputHistoryItem[]
  
  if (existing) {
    // Update existing item
    newHistory = history.map(item =>
      item.value === value
        ? { ...item, count: item.count + 1, lastUsed: new Date().toISOString() }
        : item
    )
  } else {
    // Add new item
    newHistory = [
      ...history,
      { value, count: 1, lastUsed: new Date().toISOString() }
    ]
  }
  
  // Sort by count (descending) and limit to MAX_HISTORY_ITEMS
  return newHistory
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_HISTORY_ITEMS)
}

/**
 * Store for managing input history for Plant and Machine fields
 * Persists data to localStorage
 */
export const useInputHistoryStore = create<InputHistoryState>()(
  persist(
    (set, get) => ({
      // Initial state
      plantHistory: [],
      machineHistory: [],
      
      // Add plant to history
      addPlantHistory: (plant: string) => {
        if (!plant.trim()) return
        
        set((state) => ({
          plantHistory: addToHistory(state.plantHistory, plant)
        }))
      },
      
      // Add machine to history
      addMachineHistory: (machine: string) => {
        if (!machine.trim()) return
        
        set((state) => ({
          machineHistory: addToHistory(state.machineHistory, machine)
        }))
      },
      
      // Get plant suggestions sorted by frequency
      getPlantSuggestions: () => {
        const { plantHistory } = get()
        return plantHistory.map(item => item.value)
      },
      
      // Get machine suggestions sorted by frequency
      getMachineSuggestions: () => {
        const { machineHistory } = get()
        return machineHistory.map(item => item.value)
      },
      
      // Clear all history
      clearHistory: () => {
        set({ plantHistory: [], machineHistory: [] })
      },
      
      // Clear plant history only
      clearPlantHistory: () => {
        set({ plantHistory: [] })
      },
      
      // Clear machine history only
      clearMachineHistory: () => {
        set({ machineHistory: [] })
      }
    }),
    {
      name: 'input-history-storage',
    }
  )
)