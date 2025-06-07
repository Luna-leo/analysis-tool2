"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X, Settings, Plus, ChevronDown, Search } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ManualEntryDialog, TriggerSignalDialog } from "../../dialogs"
import { useManualEntry } from "@/hooks/useManualEntry"
import { EventInfo } from "@/types"

interface DataSourceTabProps {
  selectedDataSourceItems: EventInfo[]
  setSelectedDataSourceItems: React.Dispatch<React.SetStateAction<EventInfo[]>>
}

export function DataSourceTab({
  selectedDataSourceItems,
  setSelectedDataSourceItems,
}: DataSourceTabProps) {
  const [events, setEvents] = useState<EventInfo[]>([
    {
      id: "1",
      plant: "Plant A",
      machineNo: "M001",
      label: "Maintenance",
      labelDescription: "Regular check",
      event: "Scheduled Stop",
      eventDetail: "Monthly maintenance",
      start: "2024-01-15T10:00:00",
      end: "2024-01-15T12:00:00",
    },
    {
      id: "2",
      plant: "Plant A",
      machineNo: "M002",
      label: "Production",
      labelDescription: "Normal run",
      event: "Normal Operation",
      eventDetail: "Batch processing",
      start: "2024-01-15T08:00:00",
      end: "2024-01-15T16:00:00",
    },
    {
      id: "3",
      plant: "Plant B",
      machineNo: "M003",
      label: "Alert",
      labelDescription: "Warning state",
      event: "Temperature Warning",
      eventDetail: "Above threshold",
      start: "2024-01-15T14:30:00",
      end: "2024-01-15T14:45:00",
    },
  ])
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())

  const manualEntry = useManualEntry()
  const [triggerSignalDialogOpen, setTriggerSignalDialogOpen] = useState(false)
  const [eventSearchTerm, setEventSearchTerm] = useState("")

  const [startOffset, setStartOffset] = useState(0)
  const [startOffsetUnit, setStartOffsetUnit] = useState<'min' | 'sec'>('min')
  const [endOffset, setEndOffset] = useState(0)
  const [endOffsetUnit, setEndOffsetUnit] = useState<'min' | 'sec'>('min')
  const [offsetSectionOpen, setOffsetSectionOpen] = useState(false)

  const handleSaveManualEntry = (data: any, editingItemId: string | null) => {
    if (editingItemId) {
      const updatedItem = { ...data }
      if (data.legend) {
        const legendMatch = data.legend.match(/^(.+?)\s*\((.+)\)$/)
        if (legendMatch) {
          updatedItem.label = legendMatch[1].trim()
          updatedItem.labelDescription = legendMatch[2].trim()
        } else {
          updatedItem.label = data.legend
          updatedItem.labelDescription = ""
        }
      }
      setSelectedDataSourceItems(
        selectedDataSourceItems.map((item) =>
          item.id === editingItemId ? updatedItem : item
        )
      )
    } else {
      const newEntry: EventInfo = {
        ...data,
        id: Date.now().toString(),
      }
      setSelectedDataSourceItems([...selectedDataSourceItems, newEntry])
    }
    manualEntry.close()
  }

  const handleAddTriggerSignalResults = (results: EventInfo[]) => {
    setSelectedDataSourceItems([...selectedDataSourceItems, ...results])
  }

  const resetStartOffset = () => setStartOffset(0)
  const resetEndOffset = () => setEndOffset(0)

  return (
    <>
      <div className="space-y-4">
        <div className="border rounded-lg p-3 bg-muted/30">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Selected Data Source</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={manualEntry.openForNew}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Manual Entry
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setTriggerSignalDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Signal Search
              </Button>
            </div>
          </div>

          {selectedDataSourceItems.length > 0 ? (
            <div className="space-y-3">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 text-xs px-2">Plant</TableHead>
                      <TableHead className="h-8 text-xs px-2">Machine No</TableHead>
                      <TableHead className="h-8 text-xs px-2">Legend</TableHead>
                      <TableHead className="h-8 text-xs px-2">Start</TableHead>
                      <TableHead className="h-8 text-xs px-2">End</TableHead>
                      <TableHead className="h-8 text-xs w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDataSourceItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-2 py-1 text-xs">{item.plant}</TableCell>
                        <TableCell className="px-2 py-1 text-xs">{item.machineNo}</TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          {item.labelDescription ? `${item.label} (${item.labelDescription})` : item.label}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          <div>
                            <div>{item.start.split("T")[0]}</div>
                            <div>{item.start.split("T")[1]}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          <div>
                            <div>{item.end.split("T")[0]}</div>
                            <div>{item.end.split("T")[1]}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-1 py-1">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => manualEntry.openForEdit(item)}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setSelectedDataSourceItems(
                                  selectedDataSourceItems.filter((i) => i.id !== item.id)
                                )
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Collapsible open={offsetSectionOpen} onOpenChange={setOffsetSectionOpen}>
                <div className="border rounded-lg p-3 bg-background">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">Time Offset</h4>
                        {!offsetSectionOpen && (startOffset !== 0 || endOffset !== 0) && (
                          <div className="text-xs text-muted-foreground">
                            {startOffset !== 0 && `Start: ${startOffset > 0 ? '+' : ''}${startOffset}${startOffsetUnit}`}
                            {startOffset !== 0 && endOffset !== 0 && ', '}
                            {endOffset !== 0 && `End: ${endOffset > 0 ? '+' : ''}${endOffset}${endOffsetUnit}`}
                          </div>
                        )}
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${offsetSectionOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="overflow-hidden">
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Start Offset:</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={startOffset}
                            onChange={(e) => setStartOffset(Number(e.target.value))}
                            className="w-16 h-7 text-xs"
                            placeholder="0"
                          />
                          <Select value={startOffsetUnit} onValueChange={(value: 'min' | 'sec') => setStartOffsetUnit(value)}>
                            <SelectTrigger className="w-16 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="min">min</SelectItem>
                              <SelectItem value="sec">sec</SelectItem>
                            </SelectContent>
                          </Select>
                          {startOffset !== 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({startOffset > 0 ? '+' : ''}{startOffset}{startOffsetUnit})
                            </span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={resetStartOffset}
                            disabled={startOffset === 0}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium">End Offset:</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={endOffset}
                            onChange={(e) => setEndOffset(Number(e.target.value))}
                            className="w-16 h-7 text-xs"
                            placeholder="0"
                          />
                          <Select value={endOffsetUnit} onValueChange={(value: 'min' | 'sec') => setEndOffsetUnit(value)}>
                            <SelectTrigger className="w-16 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="min">min</SelectItem>
                              <SelectItem value="sec">sec</SelectItem>
                            </SelectContent>
                          </Select>
                          {endOffset !== 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({endOffset > 0 ? '+' : ''}{endOffset}{endOffsetUnit})
                            </span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={resetEndOffset}
                            disabled={endOffset === 0}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No data source items selected. Select items from the table below and click 'Add Selected'.</p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium">Event Information</h4>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={selectedEventIds.size === 0}
              onClick={() => {
                const selectedEvents = events.filter((event) => selectedEventIds.has(event.id))
                const newItems = [...selectedDataSourceItems]
                selectedEvents.forEach((event) => {
                  if (!newItems.find((item) => item.id === event.id)) {
                    newItems.push(event)
                  }
                })
                setSelectedDataSourceItems(newItems)
                setSelectedEventIds(new Set())
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Selected ({selectedEventIds.size})
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <div className="p-2 border-b bg-muted/50 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={eventSearchTerm}
                onChange={(e) => setEventSearchTerm(e.target.value)}
                placeholder="Search events"
                className="h-8 text-sm"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-5 px-1">
                    <Checkbox
                      checked={selectedEventIds.size > 0 && events.filter((event) => {
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
                      }).length === selectedEventIds.size}
                      onCheckedChange={(checked) => {
                        const filteredEvents = events.filter((event) => {
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
                        })
                        if (checked) {
                          const newSelected = new Set(selectedEventIds)
                          filteredEvents.forEach((event) => newSelected.add(event.id))
                          setSelectedEventIds(newSelected)
                        } else {
                          const newSelected = new Set(selectedEventIds)
                          filteredEvents.forEach((event) => newSelected.delete(event.id))
                          setSelectedEventIds(newSelected)
                        }
                      }}
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
                {events
                  .filter((event) => {
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
                  })
                  .map((event) => {
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
                            onCheckedChange={(checked) => {
                              const newSelectedIds = new Set(selectedEventIds)
                              if (checked) {
                                newSelectedIds.add(event.id)
                              } else {
                                newSelectedIds.delete(event.id)
                              }
                              setSelectedEventIds(newSelectedIds)
                            }}
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
      </div>

      <ManualEntryDialog
        isOpen={manualEntry.isOpen}
        editingItemId={manualEntry.editingItemId}
        data={manualEntry.data}
        onClose={manualEntry.close}
        onUpdateData={manualEntry.updateData}
        onSave={handleSaveManualEntry}
        isValid={manualEntry.isValid()}
      />

      <TriggerSignalDialog
        isOpen={triggerSignalDialogOpen}
        onClose={() => setTriggerSignalDialogOpen(false)}
        onAddToDataSource={handleAddTriggerSignalResults}
        availableEvents={events}
      />
    </>
  )
}

