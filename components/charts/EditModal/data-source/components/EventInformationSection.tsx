"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Search } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EventInfo } from "@/types"

interface EventInformationSectionProps {
  events: EventInfo[]
  selectedEventIds: Set<string>
  setSelectedEventIds: React.Dispatch<React.SetStateAction<Set<string>>>
  selectedDataSourceItems: EventInfo[]
  onAddSelectedEvents: (selectedEvents: EventInfo[]) => void
}

export function EventInformationSection({
  events,
  selectedEventIds,
  setSelectedEventIds,
  selectedDataSourceItems,
  onAddSelectedEvents
}: EventInformationSectionProps) {
  const [eventSearchTerm, setEventSearchTerm] = useState("")

  const filterEvents = (event: EventInfo) => {
    if (!eventSearchTerm) return true
    const searchLower = eventSearchTerm.toLowerCase()
    return (
      event.plant.toLowerCase().includes(searchLower) ||
      event.machineNo.toLowerCase().includes(searchLower) ||
      event.label.toLowerCase().includes(searchLower) ||
      event.labelDescription?.toLowerCase().includes(searchLower) ||
      event.event.toLowerCase().includes(searchLower) ||
      event.eventDetail?.toLowerCase().includes(searchLower)
    )
  }

  const filteredEvents = events.filter(filterEvents)

  const handleAddSelected = () => {
    const selectedEvents = events.filter((event) => selectedEventIds.has(event.id))
    onAddSelectedEvents(selectedEvents)
    setSelectedEventIds(new Set())
  }

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return
    
    if (checked) {
      const newSelected = new Set(selectedEventIds)
      filteredEvents.forEach((event) => newSelected.add(event.id))
      setSelectedEventIds(newSelected)
    } else {
      const newSelected = new Set(selectedEventIds)
      filteredEvents.forEach((event) => newSelected.delete(event.id))
      setSelectedEventIds(newSelected)
    }
  }

  const handleToggleEvent = (eventId: string, checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return
    
    const newSelectedIds = new Set(selectedEventIds)
    if (checked) {
      newSelectedIds.add(eventId)
    } else {
      newSelectedIds.delete(eventId)
    }
    setSelectedEventIds(newSelectedIds)
  }

  return (
    <div className="border rounded-lg">
      <div className="p-3 border-b">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">Event Information</h4>
          <Button
            variant="default"
            size="sm"
            className="h-7 text-xs"
            disabled={selectedEventIds.size === 0}
            onClick={handleAddSelected}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Selected ({selectedEventIds.size})
          </Button>
        </div>
      </div>
      <div className="p-2 border-b bg-muted/50 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={eventSearchTerm}
          onChange={(e) => setEventSearchTerm(e.target.value)}
          placeholder="Search events"
          className="h-8 text-sm"
        />
      </div>
      <div className="max-h-64 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-5 px-1">
                <Checkbox
                  checked={selectedEventIds.size > 0 && filteredEvents.length === selectedEventIds.size}
                  onCheckedChange={handleSelectAll}
                  className="h-3 w-3"
                />
              </TableHead>
              <TableHead className="h-8 text-xs px-2">Plant</TableHead>
              <TableHead className="h-8 text-xs px-2">Machine</TableHead>
              <TableHead className="h-8 text-xs px-2">Label</TableHead>
              <TableHead className="h-8 text-xs px-2">Event</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.map((event) => {
              const isInSelectedDataSource = selectedDataSourceItems.some((item) => item.id === event.id)
              return (
                <TableRow
                  key={event.id}
                  className={`cursor-pointer ${selectedEventIds.has(event.id) ? 'bg-muted/50' : ''} ${isInSelectedDataSource ? 'opacity-50' : ''}`}
                  title={`${event.event}\nStart: ${event.start.replace('T', ' ')}\nEnd: ${event.end.replace('T', ' ')}`}
                >
                  <TableCell className="px-1 py-1">
                    <Checkbox
                      checked={selectedEventIds.has(event.id)}
                      disabled={isInSelectedDataSource}
                      onCheckedChange={(checked) => handleToggleEvent(event.id, checked)}
                      className="h-3 w-3"
                    />
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs">{event.plant}</TableCell>
                  <TableCell className="px-2 py-1 text-xs">{event.machineNo}</TableCell>
                  <TableCell className="px-2 py-1 text-xs">
                    <div className="leading-tight">
                      <div>{event.label}</div>
                      <div className="text-muted-foreground">{event.labelDescription || ''}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs">
                    <div className="leading-tight">
                      <div className="flex items-center gap-1">
                        {event.event}
                        {isInSelectedDataSource && (
                          <Badge variant="secondary" className="h-4 text-[10px] px-1">Added</Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground">{event.eventDetail || ''}</div>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}