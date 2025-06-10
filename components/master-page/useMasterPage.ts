import { useState, useMemo, useCallback } from 'react'
import { MasterItem, MasterPageStore } from './types'

interface UseMasterPageOptions<T extends MasterItem> {
  store: MasterPageStore<T>
  searchFields?: (keyof T)[]
  enableDuplicate?: boolean
}

export function useMasterPage<T extends MasterItem>({
  store,
  searchFields = [],
  enableDuplicate = false
}: UseMasterPageOptions<T>) {
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'duplicate'>('add')

  // Filtered items based on search query and category
  const filteredItems = useMemo(() => {
    let items = store.items

    // Apply search filter
    if (store.searchQuery) {
      const query = store.searchQuery.toLowerCase()
      items = items.filter(item => {
        if (searchFields.length > 0) {
          // Search only in specified fields
          return searchFields.some(field => {
            const value = item[field]
            return value && String(value).toLowerCase().includes(query)
          })
        } else {
          // Search in all string fields
          return Object.values(item).some(value => 
            value && typeof value === 'string' && value.toLowerCase().includes(query)
          )
        }
      })
    }

    // Apply category filter if available
    if (store.selectedCategory && store.selectedCategory !== 'all') {
      items = items.filter(item => 
        'category' in item && item.category === store.selectedCategory
      )
    }

    return items
  }, [store.items, store.searchQuery, store.selectedCategory, searchFields])

  // CRUD handlers
  const handleAdd = useCallback(() => {
    const newItem = { id: '' } as T
    setEditingItem(newItem)
    setDialogMode('add')
    setDialogOpen(true)
  }, [])

  const handleEdit = useCallback((item: T) => {
    setEditingItem(item)
    setDialogMode('edit')
    setDialogOpen(true)
  }, [])

  const handleDuplicate = useCallback((item: T) => {
    if (!enableDuplicate) return
    
    const duplicatedItem = {
      ...item,
      id: '',
      // Add (Copy) suffix to name/label if it exists
      ...(item.name && { name: `${item.name} (Copy)` }),
      ...(item.label && { label: `${item.label} (Copy)` })
    } as T
    
    setEditingItem(duplicatedItem)
    setDialogMode('duplicate')
    setDialogOpen(true)
  }, [enableDuplicate])

  const handleDelete = useCallback(async (item: T) => {
    const confirmMessage = `Are you sure you want to delete this ${
      item.name || item.label || 'item'
    }?`
    
    if (window.confirm(confirmMessage)) {
      store.deleteItem(item.id)
    }
  }, [store])

  const handleSave = useCallback((item: T) => {
    if (dialogMode === 'add' || dialogMode === 'duplicate') {
      // Generate new ID if needed
      const newItem = {
        ...item,
        id: item.id || Date.now().toString()
      }
      store.addItem(newItem)
    } else {
      store.updateItem(item)
    }
    
    setDialogOpen(false)
    setEditingItem(null)
  }, [dialogMode, store])

  const handleDialogClose = useCallback((open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingItem(null)
    }
  }, [])

  return {
    // State
    filteredItems,
    editingItem,
    dialogOpen,
    dialogMode,
    
    // Handlers
    handleAdd,
    handleEdit,
    handleDuplicate,
    handleDelete,
    handleSave,
    handleDialogClose,
    
    // Store methods
    setSearchQuery: store.setSearchQuery,
    setSelectedCategory: store.setSelectedCategory
  }
}