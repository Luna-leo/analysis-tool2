import { create } from 'zustand'
import { PredefinedCondition, predefinedConditions } from '@/data/predefinedConditions'

interface TriggerConditionStore {
  conditions: PredefinedCondition[]
  isLoading: boolean
  searchQuery: string
  
  // Dialog state
  isDialogOpen: boolean
  dialogMode: 'create' | 'edit' | 'duplicate'
  selectedCondition: PredefinedCondition | null
  
  // Actions
  setConditions: (conditions: PredefinedCondition[]) => void
  addCondition: (condition: PredefinedCondition) => void
  updateCondition: (id: string, condition: Partial<PredefinedCondition>) => void
  deleteCondition: (id: string) => void
  duplicateCondition: (id: string) => PredefinedCondition | undefined
  setSearchQuery: (query: string) => void
  setIsLoading: (loading: boolean) => void
  
  // Dialog management
  openDialog: (mode: 'create' | 'edit' | 'duplicate', condition?: PredefinedCondition) => void
  closeDialog: () => void
  
  // Computed
  getFilteredConditions: () => PredefinedCondition[]
  getConditionById: (id: string) => PredefinedCondition | undefined
}

export const useTriggerConditionStore = create<TriggerConditionStore>((set, get) => ({
  conditions: predefinedConditions,
  isLoading: false,
  searchQuery: '',
  
  // Dialog state
  isDialogOpen: false,
  dialogMode: 'create',
  selectedCondition: null,
  
  setConditions: (conditions) => set({ conditions }),
  
  addCondition: (condition) => set((state) => ({
    conditions: [...state.conditions, condition]
  })),
  
  updateCondition: (id, updatedData) => set((state) => ({
    conditions: state.conditions.map(condition => 
      condition.id === id 
        ? { ...condition, ...updatedData }
        : condition
    )
  })),
  
  deleteCondition: (id) => set((state) => ({
    conditions: state.conditions.filter(condition => condition.id !== id)
  })),
  
  duplicateCondition: (id) => {
    const state = get()
    const originalCondition = state.conditions.find(c => c.id === id)
    if (!originalCondition) return undefined
    
    const newCondition: PredefinedCondition = {
      ...originalCondition,
      id: `condition_${Date.now()}`,
      name: `${originalCondition.name} (Copy)`
    }
    
    set((state) => ({
      conditions: [...state.conditions, newCondition]
    }))
    
    return newCondition
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  // Dialog management
  openDialog: (mode, condition) => set({
    isDialogOpen: true,
    dialogMode: mode,
    selectedCondition: condition || null
  }),
  
  closeDialog: () => set({
    isDialogOpen: false,
    selectedCondition: null
  }),
  
  getFilteredConditions: () => {
    const state = get()
    let filtered = state.conditions
    
    // Filter by search query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.expression.toLowerCase().includes(query)
      )
    }
    
    // Sort by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  },
  
  getConditionById: (id) => {
    const state = get()
    return state.conditions.find(c => c.id === id)
  }
}))