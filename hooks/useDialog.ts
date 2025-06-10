import { useState, useCallback } from 'react'

export interface UseDialogOptions<T> {
  onOpen?: () => void
  onClose?: () => void
}

export interface UseDialogReturn<T> {
  isOpen: boolean
  data: T | null
  open: (data?: T) => void
  close: () => void
  toggle: () => void
  setData: (data: T | null) => void
}

/**
 * Custom hook for managing dialog state
 * @param initialData - Initial data for the dialog
 * @param options - Optional callbacks for open/close events
 */
export function useDialog<T = any>(
  initialData: T | null = null,
  options?: UseDialogOptions<T>
): UseDialogReturn<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<T | null>(initialData)

  const open = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setData(newData)
    }
    setIsOpen(true)
    options?.onOpen?.()
  }, [options])

  const close = useCallback(() => {
    setIsOpen(false)
    options?.onClose?.()
  }, [options])

  const toggle = useCallback(() => {
    if (isOpen) {
      close()
    } else {
      open()
    }
  }, [isOpen, open, close])

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData
  }
}

/**
 * Hook for managing multiple dialogs
 */
export function useDialogs<T extends Record<string, any>>() {
  const [dialogs, setDialogs] = useState<Record<string, boolean>>({})
  const [dialogData, setDialogData] = useState<T>({} as T)

  const openDialog = useCallback((name: string, data?: any) => {
    setDialogs(prev => ({ ...prev, [name]: true }))
    if (data !== undefined) {
      setDialogData(prev => ({ ...prev, [name]: data }))
    }
  }, [])

  const closeDialog = useCallback((name: string) => {
    setDialogs(prev => ({ ...prev, [name]: false }))
  }, [])

  const toggleDialog = useCallback((name: string) => {
    setDialogs(prev => ({ ...prev, [name]: !prev[name] }))
  }, [])

  const isDialogOpen = useCallback((name: string) => {
    return dialogs[name] || false
  }, [dialogs])

  const getDialogData = useCallback(<K extends keyof T>(name: K): T[K] | undefined => {
    return dialogData[name]
  }, [dialogData])

  const setData = useCallback(<K extends keyof T>(name: K, data: T[K]) => {
    setDialogData(prev => ({ ...prev, [name]: data }))
  }, [])

  return {
    openDialog,
    closeDialog,
    toggleDialog,
    isDialogOpen,
    getDialogData,
    setData,
    dialogs,
    dialogData
  }
}