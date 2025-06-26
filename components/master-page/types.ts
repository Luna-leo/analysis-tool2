import { ReactNode, ComponentType } from 'react'
import { LucideIcon } from 'lucide-react'

export interface MasterItem {
  id: string
  [key: string]: string | number | boolean | Date | null | undefined
}

export interface ColumnConfig<T> {
  key: keyof T | string
  label: string
  width: number
  sticky?: boolean
  stickyPosition?: number
  render?: (item: T) => ReactNode
}

export interface DialogProps<T> {
  item: T
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: T) => void
  mode: 'add' | 'edit' | 'duplicate'
}

export interface MasterPageConfig<T extends MasterItem> {
  // Basic config
  title: string
  description?: string
  icon: LucideIcon
  itemName: string
  
  // View configuration
  viewType: 'table' | 'cards'
  columns?: ColumnConfig<T>[]
  cardRenderer?: (item: T) => ReactNode
  cardColumns?: 1 | 2 | 3 | 4
  
  // Dialog
  DialogComponent: ComponentType<DialogProps<T>>
  
  // Features
  enableDuplicate?: boolean
  enableCategories?: boolean
  enableResize?: boolean
  customEmptyState?: ReactNode
  
  // Search configuration
  searchPlaceholder?: string
  searchFields?: (keyof T)[]
}

export interface MasterPageStore<T extends MasterItem> {
  items: T[]
  searchQuery: string
  selectedCategory?: string
  addItem: (item: T) => void
  updateItem: (item: T) => void
  deleteItem: (id: string) => void
  setSearchQuery: (query: string) => void
  setSelectedCategory?: (category: string) => void
  getCategories?: () => string[]
}