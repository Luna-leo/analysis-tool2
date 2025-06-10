"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Copy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { mockEventMasterData } from "@/data/eventMaster"
import { EventMaster } from "@/types"
import { EventEditDialog } from "./EventEditDialog"

export function EventMasterPage() {
  const [events, setEvents] = useState<EventMaster[]>(mockEventMasterData)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingEvent, setEditingEvent] = useState<EventMaster | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
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
    setEditingEvent(newEvent)
    setIsDialogOpen(true)
  }

  const handleEditEvent = (event: EventMaster) => {
    setEditingEvent(event)
    setIsDialogOpen(true)
  }

  const handleDeleteEvent = (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter((e) => e.id !== eventId))
    }
  }

  const handleDuplicateEvent = (event: EventMaster) => {
    const duplicatedEvent: EventMaster = {
      ...event,
      id: Date.now().toString(),
      label: `${event.label} (Copy)`,
    }
    // Add to table
    setEvents([...events, duplicatedEvent])
    // Open edit dialog with duplicated data
    setEditingEvent(duplicatedEvent)
    setIsDialogOpen(true)
  }

  const handleSaveEvent = (event: EventMaster) => {
    if (event.id) {
      // Update existing event
      setEvents(events.map((e) => (e.id === event.id ? event : e)))
    } else {
      // Add new event
      const newEvent = {
        ...event,
        id: Date.now().toString(),
      }
      setEvents([...events, newEvent])
    }
    setIsDialogOpen(false)
    setEditingEvent(null)
  }

  const formatDateTime = (dateTime: Date | string) => {
    const date = new Date(dateTime)
    const dateStr = date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    const timeStr = date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    return { dateStr, timeStr }
  }

  // Handle column resize
  const handleMouseDown = (column: string, e: React.MouseEvent) => {
    setResizing(column)
    setStartX(e.clientX)
    setStartWidth(columnWidths[column as keyof typeof columnWidths])
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return
      
      const diff = e.clientX - startX
      const newWidth = Math.max(50, startWidth + diff)
      
      setColumnWidths(prev => ({
        ...prev,
        [resizing]: newWidth
      }))
    }

    const handleMouseUp = () => {
      setResizing(null)
    }

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [resizing, startX, startWidth])

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Event Master</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
          <div className="overflow-auto flex-1 relative">
            <table ref={tableRef} className="text-sm w-full border-collapse" style={{ minWidth: '1200px' }}>
              <thead className="sticky top-0 z-40">
                <tr className="border-b border-gray-200">
                  <th className="bg-gray-50 px-3 py-2 text-left font-semibold text-xs text-gray-700 border-r border-gray-200 sticky left-0 z-30 relative" style={{ width: `${columnWidths.plant}px`, minWidth: `${columnWidths.plant}px` }}>
                    Plant
                    <div
                      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400"
                      onMouseDown={(e) => handleMouseDown('plant', e)}
                    />
                  </th>
                  <th className="bg-gray-50 px-3 py-2 text-left font-semibold text-xs text-gray-700 border-r-2 border-gray-300 sticky z-30 relative" style={{ left: `${columnWidths.plant}px`, width: `${columnWidths.machineNo}px`, minWidth: `${columnWidths.machineNo}px` }}>
                    Machine no
                    <div
                      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400"
                      onMouseDown={(e) => handleMouseDown('machineNo', e)}
                    />
                  </th>
                  <th className="bg-gray-50 px-3 py-2 text-left font-semibold text-xs text-gray-700 border-r border-gray-200 relative" style={{ width: `${columnWidths.start}px`, minWidth: `${columnWidths.start}px` }}>
                    Start
                    <div
                      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400"
                      onMouseDown={(e) => handleMouseDown('start', e)}
                    />
                  </th>
                  <th className="bg-gray-50 px-3 py-2 text-left font-semibold text-xs text-gray-700 border-r border-gray-200 relative" style={{ width: `${columnWidths.end}px`, minWidth: `${columnWidths.end}px` }}>
                    End
                    <div
                      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400"
                      onMouseDown={(e) => handleMouseDown('end', e)}
                    />
                  </th>
                  <th className="bg-gray-50 px-3 py-2 text-left font-semibold text-xs text-gray-700 border-r border-gray-200 relative" style={{ width: `${columnWidths.label}px`, minWidth: `${columnWidths.label}px` }}>
                    Label
                    <div
                      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400"
                      onMouseDown={(e) => handleMouseDown('label', e)}
                    />
                  </th>
                  <th className="bg-gray-50 px-3 py-2 text-left font-semibold text-xs text-gray-700 border-r border-gray-200 relative" style={{ width: `${columnWidths.labelDescription}px`, minWidth: `${columnWidths.labelDescription}px` }}>
                    Label description
                    <div
                      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400"
                      onMouseDown={(e) => handleMouseDown('labelDescription', e)}
                    />
                  </th>
                  <th className="bg-gray-50 px-3 py-2 text-left font-semibold text-xs text-gray-700 border-r border-gray-200 relative" style={{ width: `${columnWidths.event}px`, minWidth: `${columnWidths.event}px` }}>
                    Event
                    <div
                      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400"
                      onMouseDown={(e) => handleMouseDown('event', e)}
                    />
                  </th>
                  <th className="bg-gray-50 px-3 py-2 text-left font-semibold text-xs text-gray-700 border-r border-gray-200 relative" style={{ width: `${columnWidths.eventDetail}px`, minWidth: `${columnWidths.eventDetail}px` }}>
                    Event detail
                    <div
                      className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400"
                      onMouseDown={(e) => handleMouseDown('eventDetail', e)}
                    />
                  </th>
                  <th className="bg-gray-50 px-2 py-2 text-center font-semibold text-xs text-gray-700 sticky right-0 z-30 border-l-2 border-gray-300" style={{ width: `${columnWidths.actions}px`, minWidth: `${columnWidths.actions}px` }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="group hover:bg-blue-50 transition-colors border-b border-gray-100" style={{ height: '48px' }}>
                    <td className="px-3 py-2 text-xs bg-white sticky left-0 z-20 border-r border-gray-200 align-top" style={{ width: `${columnWidths.plant}px`, minWidth: `${columnWidths.plant}px`, height: '48px' }}>
                      <div className="line-clamp-2">{event.plant}</div>
                    </td>
                    <td className="px-3 py-2 text-xs bg-white sticky z-20 border-r-2 border-gray-300 align-top" style={{ left: `${columnWidths.plant}px`, width: `${columnWidths.machineNo}px`, minWidth: `${columnWidths.machineNo}px`, height: '48px' }}>
                      <div className="line-clamp-2">{event.machineNo}</div>
                    </td>
                    <td className="px-3 py-2 text-xs align-top" style={{ width: `${columnWidths.start}px`, minWidth: `${columnWidths.start}px`, height: '48px' }}>
                      <div>
                        <div>{formatDateTime(event.start).dateStr}</div>
                        <div>{formatDateTime(event.start).timeStr}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs align-top" style={{ width: `${columnWidths.end}px`, minWidth: `${columnWidths.end}px`, height: '48px' }}>
                      <div>
                        <div>{formatDateTime(event.end).dateStr}</div>
                        <div>{formatDateTime(event.end).timeStr}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs align-top" style={{ width: `${columnWidths.label}px`, minWidth: `${columnWidths.label}px`, height: '48px' }}>
                      <div className="line-clamp-2">
                        <span className="font-medium">{event.label}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs align-top" style={{ width: `${columnWidths.labelDescription}px`, minWidth: `${columnWidths.labelDescription}px`, height: '48px' }}>
                      <div className="line-clamp-2">{event.labelDescription}</div>
                    </td>
                    <td className="px-3 py-2 text-xs align-top" style={{ width: `${columnWidths.event}px`, minWidth: `${columnWidths.event}px`, height: '48px' }}>
                      <div className="line-clamp-2">{event.event}</div>
                    </td>
                    <td className="px-3 py-2 text-xs align-top" style={{ width: `${columnWidths.eventDetail}px`, minWidth: `${columnWidths.eventDetail}px`, height: '48px' }}>
                      <div className="line-clamp-2">{event.eventDetail}</div>
                    </td>
                    <td className="px-2 py-1 text-center bg-white sticky right-0 z-20 border-l-2 border-gray-300 align-middle" style={{ width: `${columnWidths.actions}px`, minWidth: `${columnWidths.actions}px`, height: '48px' }}>
                      <div className="flex gap-1 justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateEvent(event)}
                          className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
                          title="Duplicate"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                          className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 px-2 py-1 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddEvent}
              className="h-6 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Row
            </Button>
          </div>
        </div>
      </div>

      {editingEvent && (
        <EventEditDialog
          event={editingEvent}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  )
}