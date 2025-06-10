import { create } from 'zustand'
import { FormulaMaster } from '@/data/formulaMaster'
import { mockFormulaMaster } from '@/data/formulaMaster'

interface FormulaMasterStore {
  formulas: FormulaMaster[]
  isLoading: boolean
  searchQuery: string
  selectedCategory: string
  
  // Actions
  setFormulas: (formulas: FormulaMaster[]) => void
  addFormula: (formula: FormulaMaster) => void
  updateFormula: (id: string, formula: Partial<FormulaMaster>) => void
  deleteFormula: (id: string) => void
  duplicateFormula: (id: string, newName: string) => void
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string) => void
  setIsLoading: (loading: boolean) => void
  
  // Computed
  getFilteredFormulas: () => FormulaMaster[]
  getFormulaById: (id: string) => FormulaMaster | undefined
  getCategories: () => string[]
}

export const useFormulaMasterStore = create<FormulaMasterStore>((set, get) => ({
  formulas: mockFormulaMaster,
  isLoading: false,
  searchQuery: '',
  selectedCategory: 'all',
  
  setFormulas: (formulas) => set({ formulas }),
  
  addFormula: (formula) => set((state) => ({
    formulas: [...state.formulas, formula]
  })),
  
  updateFormula: (id, updatedData) => set((state) => ({
    formulas: state.formulas.map(formula => 
      formula.id === id 
        ? { ...formula, ...updatedData, updatedAt: new Date().toISOString() }
        : formula
    )
  })),
  
  deleteFormula: (id) => set((state) => ({
    formulas: state.formulas.filter(formula => formula.id !== id)
  })),
  
  duplicateFormula: (id, newName) => {
    const state = get()
    const originalFormula = state.formulas.find(f => f.id === id)
    if (!originalFormula) return
    
    const newFormula: FormulaMaster = {
      ...originalFormula,
      id: `formula_${Date.now()}`,
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    set((state) => ({
      formulas: [...state.formulas, newFormula]
    }))
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  getFilteredFormulas: () => {
    const state = get()
    let filtered = state.formulas
    
    // Filter by category
    if (state.selectedCategory && state.selectedCategory !== 'all') {
      filtered = filtered.filter(f => f.category === state.selectedCategory)
    }
    
    // Filter by search query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(query) ||
        f.expression.toLowerCase().includes(query) ||
        f.description?.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query)
      )
    }
    
    // Sort by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  },
  
  getFormulaById: (id) => {
    const state = get()
    return state.formulas.find(f => f.id === id)
  },
  
  getCategories: () => {
    const state = get()
    const categories = new Set(state.formulas.map(f => f.category))
    return Array.from(categories).sort()
  }
}))