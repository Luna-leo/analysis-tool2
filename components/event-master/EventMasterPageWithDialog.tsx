"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Copy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EventMaster } from "@/types"
import { EventEditDialog } from "./EventEditDialog"
import { useEventMasterStore } from "@/stores/useEventMasterStore"
import { useDialog } from "@/hooks/useDialog"

interface EventDialogData {
  event: EventMaster
  mode: 'add' | 'edit' | 'duplicate'
}

export const EventMasterPageWithDialog = React.memo(function EventMasterPageWithDialog() {
  const { events, setEvents, addEvent, updateEvent, deleteEvent } = useEventMasterStore()
  const [searchTerm, setSearchTerm] = useState("")
  
  // Use the dialog hook
  const dialog = useDialog<EventDialogData>()
  
  // Column widths state
  const [columnWidths, setColumnWidths] = useState({
    plant: 170,
    machineNo: 100,
    start: 110,
    end: 110,
    label: 100,
    labelDescription: 150,
    event: 150,
    eventDetail: 200,
    actions: 120
  })
  
  // Refs for resize
  const tableRef = useRef<HTMLTableElement>(null)
  const [resizing, setResizing] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const filteredEvents = useMemo(() => {
    if (!searchTerm) return events

    const lowerSearch = searchTerm.toLowerCase()
    return events.filter((event) =>
      Object.values(event).some((value) =>
        String(value).toLowerCase().includes(lowerSearch)
      )
    )
  }, [events, searchTerm])

  const handleAddEvent = () => {
    const newEvent: EventMaster = {
      id: "",
      plant: "",
      machineNo: "",
      label: "",
      labelDescription: "",
      event: "",
      eventDetail: "",
      start: new Date().toISOString(),
      end: new Date().toISOString(),
    }
    dialog.open({ event: newEvent, mode: 'add' })
  }

  const handleEditEvent = (event: EventMaster) => {
    dialog.open({ event, mode: 'edit' })
  }

  const handleDeleteEvent = (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEvent(eventId)
    }
  }

  const handleDuplicateEvent = (event: EventMaster) => {
    const duplicatedEvent: EventMaster = {
      ...event,
      id: "",
      label: `${event.label} (Copy)`,
    }
    dialog.open({ event: duplicatedEvent, mode: 'duplicate' })
  }

  const handleSaveEvent = (event: EventMaster) => {
    if (dialog.data?.mode === 'edit' && event.id) {
      // Update existing event
      updateEvent(event)
    } else {
      // Add new event (for both 'add' and 'duplicate' modes)
      const newEvent = {
        ...event,
        id: event.id || Date.now().toString(),
      }
      addEvent(newEvent)
    }
    dialog.close()
  }

  // Mouse events for column resizing
  const handleMouseDown = (column: string, e: React.MouseEvent) => {
    e.preventDefault()
    setResizing(column)
    setStartX(e.clientX)
    setStartWidth(columnWidths[column as keyof typeof columnWidths])
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizing) return
    
    const diff = e.clientX - startX
    const newWidth = Math.max(50, startWidth + diff)
    
    setColumnWidths(prev => ({
      ...prev,
      [resizing]: newWidth
    }))
  }, [resizing, startX, startWidth])

  const handleMouseUp = useCallback(() => {
    setResizing(null)
  }, [])

  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [resizing, handleMouseMove, handleMouseUp])

  // Format datetime for display
  const formatDateTime = (dateTimeStr: string | Date) => {
    try {
      const date = new Date(dateTimeStr)
      const dateStr = date.toLocaleDateString()
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      return { dateStr, timeStr }
    } catch {
      return { dateStr: '', timeStr: '' }
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Event Master</h1>
          <Button onClick={handleAddEvent} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <table ref={tableRef} className="w-full">
              {/* Table header and body remain the same as original */}
              {/* ... */}
            </table>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 px-2 py-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddEvent}
              className="h-8 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
          </div>
        </div>
      </div>

      {dialog.data && (
        <EventEditDialog
          item={dialog.data.event}
          open={dialog.isOpen}
          onOpenChange={dialog.close}
          onSave={handleSaveEvent}
          mode={dialog.data.mode}
        />
      )}
    </div>
  )
})

// Import useCallback from React
import { useCallback } from "react"