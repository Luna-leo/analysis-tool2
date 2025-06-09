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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Search } from "lucide-react"

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
          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedEventIds.size === filteredEvents.length && filteredEvents.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Plant</TableHead>
                  <TableHead>Machine No</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedEventIds.has(event.id)}
                        onCheckedChange={() => handleToggleEvent(event.id)}
                      />
                    </TableCell>
                    <TableCell>{event.plant}</TableCell>
                    <TableCell>{event.machineNo}</TableCell>
                    <TableCell>{event.label}</TableCell>
                    <TableCell>{event.event}</TableCell>
                    <TableCell className="text-xs">{new Date(event.start).toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{new Date(event.end).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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