import { useState, useCallback, useMemo } from 'react'

// Sorting
export interface SortConfig<T> {
  key: keyof T | null
  direction: 'asc' | 'desc'
}

export function useTableSort<T>(items: T[], initialSort?: SortConfig<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(
    initialSort || { key: null, direction: 'asc' }
  )

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return items

    return [...items].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [items, sortConfig])

  return { sortedItems, sortConfig, handleSort }
}

// Column Resizing
export interface ColumnWidths {
  [key: string]: number
}

export function useColumnResize(initialWidths: ColumnWidths = {}) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(initialWidths)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)

  const handleResizeStart = useCallback((column: string) => {
    setResizingColumn(column)
  }, [])

  const handleResize = useCallback((column: string, newWidth: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: Math.max(50, newWidth) // Minimum width of 50px
    }))
  }, [])

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null)
  }, [])

  return {
    columnWidths,
    resizingColumn,
    handleResizeStart,
    handleResize,
    handleResizeEnd
  }
}

// Row Selection
export function useRowSelection<T extends { id: string }>() {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const toggleRow = useCallback((id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback((items: T[]) => {
    setSelectedRows(prev => {
      if (prev.size === items.length) {
        return new Set()
      } else {
        return new Set(items.map(item => item.id))
      }
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set())
  }, [])

  const isSelected = useCallback((id: string) => {
    return selectedRows.has(id)
  }, [selectedRows])

  return {
    selectedRows,
    toggleRow,
    toggleAll,
    clearSelection,
    isSelected,
    selectedCount: selectedRows.size
  }
}

// Pagination
export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
}

export function usePagination<T>(
  items: T[],
  initialPageSize: number = 10
) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return items.slice(start, end)
  }, [items, page, pageSize])

  const totalPages = Math.ceil(items.length / pageSize)

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)))
  }, [totalPages])

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page
  }, [])

  return {
    paginatedItems,
    page,
    pageSize,
    totalPages,
    total: items.length,
    goToPage,
    changePageSize,
    canGoNext: page < totalPages,
    canGoPrev: page > 1
  }
}

// Combined Table Features Hook
export function useTableFeatures<T extends { id: string }>(
  items: T[],
  options?: {
    enableSort?: boolean
    enableResize?: boolean
    enableSelection?: boolean
    enablePagination?: boolean
    initialSort?: SortConfig<T>
    initialWidths?: ColumnWidths
    initialPageSize?: number
  }
) {
  const {
    enableSort = true,
    enableResize = true,
    enableSelection = true,
    enablePagination = false,
    initialSort,
    initialWidths,
    initialPageSize
  } = options || {}

  const sort = enableSort ? useTableSort(items, initialSort) : null
  const resize = enableResize ? useColumnResize(initialWidths) : null
  const selection = enableSelection ? useRowSelection<T>() : null
  const pagination = enablePagination 
    ? usePagination(sort?.sortedItems || items, initialPageSize)
    : null

  const processedItems = pagination?.paginatedItems || sort?.sortedItems || items

  return {
    items: processedItems,
    sort,
    resize,
    selection,
    pagination
  }
}