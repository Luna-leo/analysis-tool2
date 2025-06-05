import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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

interface SearchPeriodSectionProps {
  searchPeriodType: 'events' | 'manual'
  onSearchPeriodTypeChange: (type: 'events' | 'manual') => void
  selectedEventIds: Set<string>
  onSelectedEventIdsChange: (ids: Set<string>) => void
  eventSearchQuery: string
  onEventSearchQueryChange: (query: string) => void
  manualPeriod: {
    start: string
    end: string
    plant: string
    machineNo: string
  }
  onManualPeriodChange: (period: any) => void
  filteredEvents: EventInfo[]
}

export const SearchPeriodSection: React.FC<SearchPeriodSectionProps> = ({
  searchPeriodType,
  onSearchPeriodTypeChange,
  selectedEventIds,
  onSelectedEventIdsChange,
  eventSearchQuery,
  onEventSearchQueryChange,
  manualPeriod,
  onManualPeriodChange,
  filteredEvents
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Search Period</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={searchPeriodType}
          onValueChange={onSearchPeriodTypeChange}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="events" id="events" />
            <Label htmlFor="events">Use Event Table Periods</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual">Manual Period Specification</Label>
          </div>
        </RadioGroup>
        
        {searchPeriodType === 'events' && (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden max-h-64">
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
              <div className="overflow-y-auto max-h-48">
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
                        <TableCell className="px-2 py-1 text-xs">
                          <div>
                            <div>{event.start.split("T")[0]}</div>
                            <div>{event.start.split("T")[1]}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          <div>
                            <div>{event.end.split("T")[0]}</div>
                            <div>{event.end.split("T")[1]}</div>
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
        )}
        
        {searchPeriodType === 'manual' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-plant">
                  Plant <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="manual-plant"
                  value={manualPeriod.plant}
                  onChange={(e) => onManualPeriodChange({ ...manualPeriod, plant: e.target.value })}
                  placeholder="Enter plant name"
                />
              </div>
              <div>
                <Label htmlFor="manual-machine">
                  Machine No <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="manual-machine"
                  value={manualPeriod.machineNo}
                  onChange={(e) => onManualPeriodChange({ ...manualPeriod, machineNo: e.target.value })}
                  placeholder="Enter machine number"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-start">
                  Start Date/Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="manual-start"
                  type="datetime-local"
                  value={manualPeriod.start}
                  onChange={(e) => onManualPeriodChange({ ...manualPeriod, start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="manual-end">
                  End Date/Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="manual-end"
                  type="datetime-local"
                  value={manualPeriod.end}
                  onChange={(e) => onManualPeriodChange({ ...manualPeriod, end: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}