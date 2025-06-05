import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Plus, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EventInfo, ManualPeriod } from '@/types'

interface SearchPeriodSectionProps {
  searchPeriodType: 'events' | 'manual'
  onSearchPeriodTypeChange: (type: 'events' | 'manual') => void
  selectedEventIds: Set<string>
  onSelectedEventIdsChange: (ids: Set<string>) => void
  eventSearchQuery: string
  onEventSearchQueryChange: (query: string) => void
  manualPeriod?: {
    start: string
    end: string
    plant: string
    machineNo: string
  }
  onManualPeriodChange?: (period: any) => void
  manualPeriods?: ManualPeriod[]
  onAddManualPeriod?: () => void
  onRemoveManualPeriod?: (id: string) => void
  onUpdateManualPeriod?: (id: string, updates: Partial<ManualPeriod>) => void
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
  manualPeriods,
  onAddManualPeriod,
  onRemoveManualPeriod,
  onUpdateManualPeriod,
  filteredEvents
}) => {
  // Use new multiple periods if available, otherwise fall back to single period
  const periods = manualPeriods || (manualPeriod ? [{
    id: '1',
    ...manualPeriod
  }] : [])

  const handleUpdatePeriod = (id: string, updates: Partial<ManualPeriod>) => {
    if (onUpdateManualPeriod) {
      onUpdateManualPeriod(id, updates)
    } else if (onManualPeriodChange && manualPeriod) {
      // Fallback for single period
      onManualPeriodChange({ ...manualPeriod, ...updates })
    }
  }

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
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual">Manual Period Specification</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="events" id="events" />
            <Label htmlFor="events">Use Event Table Periods</Label>
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
            <div className="border rounded-lg overflow-hidden max-h-64">
              <div className="p-3 bg-muted/30 border-b">
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm font-medium">Manual Period Entries:</Label>
                  {onAddManualPeriod && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onAddManualPeriod}
                      className="h-7"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Period
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-y-auto max-h-48">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 text-xs px-2">Plant</TableHead>
                      <TableHead className="h-8 text-xs px-2">Machine</TableHead>
                      <TableHead className="h-8 text-xs px-2">Start</TableHead>
                      <TableHead className="h-8 text-xs px-2">End</TableHead>
                      <TableHead className="w-12 h-8 text-xs px-2">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periods.length > 0 ? periods.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell className="px-2 py-1 text-xs">
                          <Input
                            value={period.plant}
                            onChange={(e) => handleUpdatePeriod(period.id, { plant: e.target.value })}
                            placeholder="Enter plant name"
                            className="h-6 text-xs border-0 bg-transparent p-1 focus-visible:ring-1"
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          <Input
                            value={period.machineNo}
                            onChange={(e) => handleUpdatePeriod(period.id, { machineNo: e.target.value })}
                            placeholder="Enter machine number"
                            className="h-6 text-xs border-0 bg-transparent p-1 focus-visible:ring-1"
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          <Input
                            type="datetime-local"
                            step="1"
                            value={period.start}
                            onChange={(e) => handleUpdatePeriod(period.id, { start: e.target.value })}
                            className="h-6 text-xs border-0 bg-transparent p-1 focus-visible:ring-1 font-mono"
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          <Input
                            type="datetime-local"
                            step="1"
                            value={period.end}
                            onChange={(e) => handleUpdatePeriod(period.id, { end: e.target.value })}
                            className="h-6 text-xs border-0 bg-transparent p-1 focus-visible:ring-1 font-mono"
                          />
                        </TableCell>
                        <TableCell className="px-1 py-1">
                          {onRemoveManualPeriod && periods.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveManualPeriod(period.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-xs">
                          No manual periods added yet. Click "Add Period" to create one.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}