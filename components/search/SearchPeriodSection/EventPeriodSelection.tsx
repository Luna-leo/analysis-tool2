"use client"

import React from 'react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EventInfo } from '@/types'
import { formatDateTimeForDisplay } from '@/lib/dateUtils'

interface EventPeriodSelectionProps {
  selectedEventIds: Set<string>
  onSelectedEventIdsChange: (ids: Set<string>) => void
  eventSearchQuery: string
  onEventSearchQueryChange: (query: string) => void
  filteredEvents: EventInfo[]
}

export const EventPeriodSelection: React.FC<EventPeriodSelectionProps> = ({
  selectedEventIds,
  onSelectedEventIdsChange,
  eventSearchQuery,
  onEventSearchQueryChange,
  filteredEvents,
}) => {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 bg-muted/30 border-b">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Select Events for Period Range:</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search events..."
                value={eventSearchQuery}
                onChange={(e) => onEventSearchQueryChange(e.target.value)}
                className="h-7 w-48 text-xs"
              />
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {selectedEventIds.size} of {filteredEvents.length} selected
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredEvents.length > 0 && filteredEvents.every(e => selectedEventIds.has(e.id))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const newSelected = new Set(selectedEventIds)
                        filteredEvents.forEach(e => newSelected.add(e.id))
                        onSelectedEventIdsChange(newSelected)
                      } else {
                        const newSelected = new Set(selectedEventIds)
                        filteredEvents.forEach(e => newSelected.delete(e.id))
                        onSelectedEventIdsChange(newSelected)
                      }
                    }}
                    className="h-3 w-3"
                  />
                </TableHead>
                <TableHead className="h-8 text-xs px-2">Plant</TableHead>
                <TableHead className="h-8 text-xs px-2">Machine</TableHead>
                <TableHead className="h-8 text-xs px-2">Label</TableHead>
                <TableHead className="h-8 text-xs px-2">Event</TableHead>
                <TableHead className="h-8 text-xs px-2">Start</TableHead>
                <TableHead className="h-8 text-xs px-2">End</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                <TableRow 
                  key={event.id}
                  className={`cursor-pointer ${selectedEventIds.has(event.id) ? "bg-primary/10" : ""}`}
                  onClick={() => {
                    const newSelectedIds = new Set(selectedEventIds)
                    if (selectedEventIds.has(event.id)) {
                      newSelectedIds.delete(event.id)
                    } else {
                      newSelectedIds.add(event.id)
                    }
                    onSelectedEventIdsChange(newSelectedIds)
                  }}
                >
                  <TableCell className="px-1 py-1">
                    <Checkbox
                      checked={selectedEventIds.has(event.id)}
                      onCheckedChange={(checked) => {
                        const newSelectedIds = new Set(selectedEventIds)
                        if (checked) {
                          newSelectedIds.add(event.id)
                        } else {
                          newSelectedIds.delete(event.id)
                        }
                        onSelectedEventIdsChange(newSelectedIds)
                      }}
                      className="h-3 w-3"
                    />
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs">{event.plant}</TableCell>
                  <TableCell className="px-2 py-1 text-xs">{event.machineNo}</TableCell>
                  <TableCell className="px-2 py-1 text-xs">
                    <div className="leading-tight">
                      <div>{event.label}</div>
                      <div className="text-muted-foreground">{event.labelDescription || ""}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs">
                    <div className="leading-tight">
                      <div>{event.event}</div>
                      <div className="text-muted-foreground">{event.eventDetail || ""}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <div className="leading-tight">
                      <div className="text-sm">{formatDateTimeForDisplay(event.start).date}</div>
                      <div className="text-sm text-muted-foreground">{formatDateTimeForDisplay(event.start).time}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <div className="leading-tight">
                      <div className="text-sm">{formatDateTimeForDisplay(event.end).date}</div>
                      <div className="text-sm text-muted-foreground">{formatDateTimeForDisplay(event.end).time}</div>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground text-xs">
                    {eventSearchQuery ? 'No events found matching your search.' : 'No events available.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}