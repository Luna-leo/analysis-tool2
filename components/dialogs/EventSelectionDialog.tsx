import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EventInfo } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Search } from "lucide-react"
import { formatDateTimeForDisplay } from "@/utils/dateUtils"

interface EventSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  events: EventInfo[]
  onAddEvents: (events: EventInfo[]) => void
}

export const EventSelectionDialog: React.FC<EventSelectionDialogProps> = ({
  isOpen,
  onClose,
  events,
  onAddEvents,
}) => {
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = events.filter(event => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      event.plant.toLowerCase().includes(query) ||
      event.machineNo.toLowerCase().includes(query) ||
      event.label.toLowerCase().includes(query) ||
      event.event.toLowerCase().includes(query)
    )
  })

  const handleToggleEvent = (eventId: string) => {
    const newSelectedIds = new Set(selectedEventIds)
    if (newSelectedIds.has(eventId)) {
      newSelectedIds.delete(eventId)
    } else {
      newSelectedIds.add(eventId)
    }
    setSelectedEventIds(newSelectedIds)
  }

  const handleSelectAll = () => {
    if (selectedEventIds.size === filteredEvents.length) {
      setSelectedEventIds(new Set())
    } else {
      setSelectedEventIds(new Set(filteredEvents.map(e => e.id)))
    }
  }

  const handleAdd = () => {
    const selectedEvents = events.filter(e => selectedEventIds.has(e.id))
    onAddEvents(selectedEvents)
    setSelectedEventIds(new Set())
    setSearchQuery('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Events</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Events Table */}
          <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1">
            <div className="overflow-auto" style={{ maxHeight: 'calc(80vh - 250px)' }}>
              <table className="text-sm w-full border-collapse">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-white border-b-2 border-gray-200">
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-center" style={{ width: '40px' }}>
                      <Checkbox
                        checked={selectedEventIds.size === filteredEvents.length && filteredEvents.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-left" style={{ width: '100px' }}>Plant</th>
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-left" style={{ width: '120px' }}>Machine No</th>
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-left">Label</th>
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-left">Event</th>
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-left" style={{ width: '100px' }}>Start</th>
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-left" style={{ width: '100px' }}>End</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="group hover:bg-blue-50 transition-colors border-b border-gray-100">
                      <td className="px-2 py-1 text-center bg-white group-hover:bg-blue-50">
                        <Checkbox
                          checked={selectedEventIds.has(event.id)}
                          onCheckedChange={() => handleToggleEvent(event.id)}
                        />
                      </td>
                      <td className="px-2 py-1 bg-white group-hover:bg-blue-50">{event.plant}</td>
                      <td className="px-2 py-1 bg-white group-hover:bg-blue-50">{event.machineNo}</td>
                      <td className="px-2 py-1 bg-white group-hover:bg-blue-50">
                        <div className="leading-tight">
                          <div className="text-sm">{event.label}</div>
                          <div className="text-xs text-gray-500">{event.labelDescription || ""}</div>
                        </div>
                      </td>
                      <td className="px-2 py-1 bg-white group-hover:bg-blue-50">
                        <div className="leading-tight">
                          <div className="text-sm">{event.event}</div>
                          <div className="text-xs text-gray-500">{event.eventDetail || ""}</div>
                        </div>
                      </td>
                      <td className="px-2 py-1 bg-white group-hover:bg-blue-50">
                        <div className="leading-tight">
                          <div className="text-sm">{formatDateTimeForDisplay(event.start).date}</div>
                          <div className="text-xs text-gray-500">{formatDateTimeForDisplay(event.start).time}</div>
                        </div>
                      </td>
                      <td className="px-2 py-1 bg-white group-hover:bg-blue-50">
                        <div className="leading-tight">
                          <div className="text-sm">{formatDateTimeForDisplay(event.end).date}</div>
                          <div className="text-xs text-gray-500">{formatDateTimeForDisplay(event.end).time}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {selectedEventIds.size} event{selectedEventIds.size !== 1 ? 's' : ''} selected
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selectedEventIds.size === 0}>
            Add Selected Events
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}