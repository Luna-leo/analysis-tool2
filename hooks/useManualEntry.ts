import { useState } from 'react'
import { formatDateTimeForInput } from '@/utils/dateUtils'
import { EventInfo } from '@/types'

export interface ManualEntryData extends EventInfo {
  legend?: string
}

export const useManualEntry = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [data, setData] = useState<ManualEntryData>({
    id: "",
    plant: "",
    machineNo: "",
    label: "",
    labelDescription: "",
    event: "",
    eventDetail: "",
    start: "",
    end: "",
    legend: ""
  })

  const openForNew = () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    setData({
      id: "",
      plant: "",
      machineNo: "",
      label: "",
      labelDescription: "",
      event: "",
      eventDetail: "",
      start: formatDateTimeForInput(oneHourAgo),
      end: formatDateTimeForInput(now),
      legend: ""
    })
    setEditingItemId(null)
    setIsOpen(true)
  }

  const openForEdit = (item: EventInfo) => {
    const legend = item.labelDescription 
      ? `${item.label} (${item.labelDescription})` 
      : item.label
    
    // Format dates for datetime-local input
    const formattedStart = item.start ? formatDateTimeForInput(new Date(item.start)) : ''
    const formattedEnd = item.end ? formatDateTimeForInput(new Date(item.end)) : ''
    
    setData({ 
      ...item, 
      start: formattedStart,
      end: formattedEnd,
      legend 
    })
    setEditingItemId(item.id)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setEditingItemId(null)
    setData({
      id: "",
      plant: "",
      machineNo: "",
      label: "",
      labelDescription: "",
      event: "",
      eventDetail: "",
      start: "",
      end: "",
      legend: ""
    })
  }

  const updateData = (updates: Partial<ManualEntryData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const isValid = () => {
    return !!(
      data.plant && 
      data.machineNo && 
      data.start && 
      data.end &&
      (editingItemId ? data.legend : data.label)
    )
  }

  return {
    isOpen,
    editingItemId,
    data,
    openForNew,
    openForEdit,
    close,
    updateData,
    isValid
  }
}