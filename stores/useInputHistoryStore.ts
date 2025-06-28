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
  labelHistory: InputHistoryItem[]
  eventHistory: InputHistoryItem[]
  
  // Actions
  addPlantHistory: (plant: string) => void
  addMachineHistory: (machine: string) => void
  addLabelHistory: (label: string) => void
  addEventHistory: (event: string) => void
  getPlantSuggestions: () => string[]
  getMachineSuggestions: () => string[]
  getLabelSuggestions: () => string[]
  getEventSuggestions: () => string[]
  clearHistory: () => void
  clearPlantHistory: () => void
  clearMachineHistory: () => void
  clearLabelHistory: () => void
  clearEventHistory: () => void
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
      labelHistory: [],
      eventHistory: [],
      
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
      
      // Add label to history
      addLabelHistory: (label: string) => {
        if (!label.trim()) return
        
        set((state) => ({
          labelHistory: addToHistory(state.labelHistory, label)
        }))
      },
      
      // Add event to history
      addEventHistory: (event: string) => {
        if (!event.trim()) return
        
        set((state) => ({
          eventHistory: addToHistory(state.eventHistory, event)
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
      
      // Get label suggestions sorted by frequency
      getLabelSuggestions: () => {
        const { labelHistory } = get()
        return labelHistory.map(item => item.value)
      },
      
      // Get event suggestions sorted by frequency
      getEventSuggestions: () => {
        const { eventHistory } = get()
        return eventHistory.map(item => item.value)
      },
      
      // Clear all history
      clearHistory: () => {
        set({ plantHistory: [], machineHistory: [], labelHistory: [], eventHistory: [] })
      },
      
      // Clear plant history only
      clearPlantHistory: () => {
        set({ plantHistory: [] })
      },
      
      // Clear machine history only
      clearMachineHistory: () => {
        set({ machineHistory: [] })
      },
      
      // Clear label history only
      clearLabelHistory: () => {
        set({ labelHistory: [] })
      },
      
      // Clear event history only
      clearEventHistory: () => {
        set({ eventHistory: [] })
      }
    }),
    {
      name: 'input-history-storage',
    }
  )
)