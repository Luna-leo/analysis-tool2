import { formatDateToISO } from '@/utils/dateUtils'

export interface BaseItem {
  id: string
  createdAt?: string
  updatedAt?: string
}

export interface BaseStoreState<T extends BaseItem> {
  items: T[]
  isLoading: boolean
  searchQuery: string
}

export interface BaseStoreActions<T extends BaseItem> {
  setItems: (items: T[]) => void
  addItem: (item: T) => void
  updateItem: (id: string, item: Partial<T>) => void
  deleteItem: (id: string) => void
  setSearchQuery: (query: string) => void
  setIsLoading: (loading: boolean) => void
  getItemById: (id: string) => T | undefined
  getFilteredItems: () => T[]
}

export type BaseStore<T extends BaseItem> = BaseStoreState<T> & BaseStoreActions<T>

export function createBaseStore<T extends BaseItem>(
  initialItems: T[] = [],
  searchFields: (keyof T)[]
) {
  return (set: any, get: any): BaseStore<T> => ({
    items: initialItems,
    isLoading: false,
    searchQuery: '',

    setItems: (items) => set({ items }),

    addItem: (item) => {
      const newItem: T = {
        ...item,
        id: item.id || `item_${Date.now()}`,
        createdAt: item.createdAt || formatDateToISO(new Date()),
        updatedAt: formatDateToISO(new Date())
      }
      set((state: BaseStoreState<T>) => ({
        items: [...state.items, newItem]
      }))
    },

    updateItem: (id, updatedData) => {
      set((state: BaseStoreState<T>) => ({
        items: state.items.map(item =>
          item.id === id
            ? { ...item, ...updatedData, updatedAt: formatDateToISO(new Date()) }
            : item
        )
      }))
    },

    deleteItem: (id) => {
      set((state: BaseStoreState<T>) => ({
        items: state.items.filter(item => item.id !== id)
      }))
    },

    setSearchQuery: (query) => set({ searchQuery: query }),

    setIsLoading: (loading) => set({ isLoading: loading }),

    getItemById: (id) => {
      const state = get() as BaseStoreState<T>
      return state.items.find(item => item.id === id)
    },

    getFilteredItems: () => {
      const state = get() as BaseStoreState<T>
      const query = state.searchQuery.toLowerCase()
      
      if (!query) return state.items

      return state.items.filter(item => {
        return searchFields.some(field => {
          const value = item[field]
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query)
          }
          return false
        })
      })
    }
  })
}

// Utility function for creating duplicate functionality
export function createDuplicateFunction<T extends BaseItem & { name: string }>(
  generateId: () => string
) {
  return (get: any, set: any) => (id: string, newName: string) => {
    const state = get() as BaseStoreState<T>
    const original = state.items.find(item => item.id === id)
    if (!original) return

    const duplicate: T = {
      ...original,
      id: generateId(),
      name: newName,
      createdAt: formatDateToISO(new Date()),
      updatedAt: formatDateToISO(new Date())
    }

    set((state: BaseStoreState<T>) => ({
      items: [...state.items, duplicate]
    }))
  }
}