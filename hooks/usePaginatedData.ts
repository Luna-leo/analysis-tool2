import { useState, useCallback, useEffect, useRef } from 'react'
import { CSVDataPoint } from '@/stores/useCSVDataStore'

interface PaginationState {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

interface UsePaginatedDataOptions {
  pageSize?: number
  initialPage?: number
}

interface UsePaginatedDataReturn<T> {
  data: T[]
  pagination: PaginationState
  loading: boolean
  error: Error | null
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  setPageSize: (size: number) => void
  refresh: () => void
}

export function usePaginatedData<T = CSVDataPoint>(
  fetchData: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  options: UsePaginatedDataOptions = {}
): UsePaginatedDataReturn<T> {
  const { pageSize = 1000, initialPage = 1 } = options
  
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: initialPage,
    pageSize,
    totalItems: 0,
    totalPages: 0
  })
  
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const loadPage = useCallback(async (page: number, size: number) => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await fetchData(page, size)
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }
      
      setData(result.data)
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        pageSize: size,
        totalItems: result.total,
        totalPages: Math.ceil(result.total / size)
      }))
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [fetchData])
  
  // Load initial page
  useEffect(() => {
    loadPage(pagination.currentPage, pagination.pageSize)
    
    return () => {
      // Cleanup: abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []) // Only run on mount
  
  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    loadPage(page, pagination.pageSize)
  }, [loadPage, pagination.totalPages, pagination.pageSize])
  
  const nextPage = useCallback(() => {
    goToPage(pagination.currentPage + 1)
  }, [goToPage, pagination.currentPage])
  
  const previousPage = useCallback(() => {
    goToPage(pagination.currentPage - 1)
  }, [goToPage, pagination.currentPage])
  
  const setPageSize = useCallback((size: number) => {
    if (size < 1) return
    
    // Calculate new current page to maintain position
    const currentFirstItem = (pagination.currentPage - 1) * pagination.pageSize + 1
    const newPage = Math.ceil(currentFirstItem / size)
    
    loadPage(newPage, size)
  }, [loadPage, pagination.currentPage, pagination.pageSize])
  
  const refresh = useCallback(() => {
    loadPage(pagination.currentPage, pagination.pageSize)
  }, [loadPage, pagination.currentPage, pagination.pageSize])
  
  return {
    data,
    pagination,
    loading,
    error,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    refresh
  }
}