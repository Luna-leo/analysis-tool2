"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Calendar, 
  Filter, 
  Clock, 
  MoreHorizontal,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  Undo2
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { EventInfo, SearchCondition, SearchResult } from "@/types"
import { ManualEntryDialog } from "../../../dialogs/ManualEntryDialog"
import { TriggerSignalDialog } from "../../../dialogs/TriggerSignalDialog"
import { EventSelectionDialog } from "../../../dialogs/EventSelectionDialog"
import { useManualEntry } from "@/hooks/useManualEntry"
import { TimeOffsetSettings } from "./components"

interface DataSourceTabProps {
  selectedDataSourceItems: EventInfo[]
  setSelectedDataSourceItems: React.Dispatch<React.SetStateAction<EventInfo[]>>
}


// セクションヘッダー
function SectionHeader({ 
  title, 
  count, 
  actions 
}: { 
  title: string
  count?: number
  actions?: React.ReactNode 
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        {count !== undefined && (
          <Badge variant="secondary" className="h-5 text-xs">
            {count}
          </Badge>
        )}
      </div>
      {actions}
    </div>
  )
}


export function DataSourceTab({
  selectedDataSourceItems,
  setSelectedDataSourceItems,
}: DataSourceTabProps) {
  // Dialog states
  const manualEntry = useManualEntry()
  const [eventSelectionOpen, setEventSelectionOpen] = useState(false)
  const [triggerSignalDialogOpen, setTriggerSignalDialogOpen] = useState(false)

  // Available periods (pool)
  const [availablePeriods, setAvailablePeriods] = useState<EventInfo[]>([])
  const [filteredPeriods, setFilteredPeriods] = useState<EventInfo[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterActive, setFilterActive] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [appliedConditions, setAppliedConditions] = useState<SearchCondition[]>([])
  const [selectedFilteredRows, setSelectedFilteredRows] = useState<Set<string>>(new Set())
  
  // Track source of items in selected data sources
  const [itemSources, setItemSources] = useState<Map<string, 'available' | 'filtered'>>(new Map())
  
  // Active section state
  const [activeSection, setActiveSection] = useState<'available' | 'filtered' | 'selected'>('available')

  // Time offset states
  const [startOffset, setStartOffset] = useState(0)
  const [startOffsetUnit, setStartOffsetUnit] = useState<'min' | 'sec'>('min')
  const [endOffset, setEndOffset] = useState(0)
  const [endOffsetUnit, setEndOffsetUnit] = useState<'min' | 'sec'>('min')
  const [offsetSectionOpen, setOffsetSectionOpen] = useState(false)

  // Event list for EventSelectionDialog
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


  // Action handlers
  const handleAction = (action: string, period: EventInfo, list: "available" | "filtered" | "selected") => {
    switch (action) {
      case "remove":
        if (list === "available") {
          setAvailablePeriods(availablePeriods.filter(p => p.id !== period.id))
        } else if (list === "filtered") {
          setFilteredPeriods(filteredPeriods.filter(p => p.id !== period.id))
        } else if (list === "selected") {
          setSelectedDataSourceItems(selectedDataSourceItems.filter(p => p.id !== period.id))
          
          // Get the source and restore to appropriate list
          const source = itemSources.get(period.id)
          if (source === 'filtered' && filterActive) {
            // Return to filtered results if filter is still active
            setFilteredPeriods([...filteredPeriods, period])
          } else {
            // Return to available periods
            setAvailablePeriods([...availablePeriods, period])
          }
          
          // Remove from source tracking
          const newSources = new Map(itemSources)
          newSources.delete(period.id)
          setItemSources(newSources)
        }
        break
      case "edit":
        manualEntry.openForEdit(period)
        break
      case "duplicate":
        const duplicate = { ...period, id: `${period.id}_copy_${Date.now()}` }
        if (list === "available") {
          setAvailablePeriods([...availablePeriods, duplicate])
        } else if (list === "selected") {
          setSelectedDataSourceItems([...selectedDataSourceItems, duplicate])
        }
        break
    }
  }

  // Manual entry save handler
  const handleSaveManualEntry = (data: any, editingItemId: string | null) => {
    const processedData = { ...data }
    if (data.legend) {
      const legendMatch = data.legend.match(/^(.+?)\s*\((.+)\)$/)
      if (legendMatch) {
        processedData.label = legendMatch[1].trim()
        processedData.labelDescription = legendMatch[2].trim()
      } else {
        processedData.label = data.legend
        processedData.labelDescription = ""
      }
    }

    if (editingItemId) {
      // Check if editing item from available periods or from selected data sources
      const isInAvailable = availablePeriods.some(item => item.id === editingItemId)
      const isInFiltered = filteredPeriods.some(item => item.id === editingItemId)
      const isInDataSource = selectedDataSourceItems.some(item => item.id === editingItemId)
      
      if (isInAvailable) {
        setAvailablePeriods(
          availablePeriods.map((item) =>
            item.id === editingItemId ? processedData : item
          )
        )
      } else if (isInFiltered) {
        setFilteredPeriods(
          filteredPeriods.map((item) =>
            item.id === editingItemId ? processedData : item
          )
        )
      } else if (isInDataSource) {
        setSelectedDataSourceItems(
          selectedDataSourceItems.map((item) =>
            item.id === editingItemId ? processedData : item
          )
        )
      }
    } else {
      const newEntry: EventInfo = {
        ...processedData,
        id: `manual_${Date.now()}`,
      }
      setAvailablePeriods([...availablePeriods, newEntry])
    }
    manualEntry.close()
  }

  const handleAddEventsToPool = (eventsToAdd: EventInfo[]) => {
    const newPeriods = [...availablePeriods]
    eventsToAdd.forEach((event) => {
      // Avoid duplicates
      if (!newPeriods.find((p) => p.id === event.id)) {
        newPeriods.push(event)
      }
    })
    setAvailablePeriods(newPeriods)
  }

  const handleApplyFilter = () => {
    setTriggerSignalDialogOpen(true)
  }

  const handleApplyConditions = async (conditions: SearchCondition[]) => {
    setAppliedConditions(conditions)
    setIsSearching(true)
    setFilterActive(true)
    
    // Get periods to search (all available periods)
    const periodsToSearch = availablePeriods
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate filtered periods based on conditions
    const filtered = periodsToSearch.slice(0, Math.max(1, Math.floor(periodsToSearch.length / 2))).map(p => ({
      ...p,
      id: `filtered_${p.id}_${Date.now()}`,
      label: `Filtered: ${p.label}`,
      labelDescription: `Matched conditions: ${conditions.map(c => `${c.parameter} ${c.operator} ${c.value}`).join(', ')}`
    }))
    
    setFilteredPeriods(filtered)
    setIsSearching(false)
  }
  
  const handleClearFilter = () => {
    setFilterActive(false)
    setFilteredPeriods([])
    setAppliedConditions([])
    setSelectedFilteredRows(new Set())
    
    // Clear source tracking for filtered items
    const newSources = new Map(itemSources)
    itemSources.forEach((source, id) => {
      if (source === 'filtered') {
        newSources.delete(id)
      }
    })
    setItemSources(newSources)
  }

  // Filter available periods by search query
  const displayedAvailablePeriods = availablePeriods.filter(period => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      period.label.toLowerCase().includes(searchLower) ||
      period.plant.toLowerCase().includes(searchLower) ||
      period.machineNo.toLowerCase().includes(searchLower) ||
      (period.labelDescription?.toLowerCase().includes(searchLower) ?? false)
    )
  })

  return (
    <>
      <div className="h-full flex flex-col gap-3 overflow-y-auto">
        {/* Available Periods */}
        <Card className="p-4 flex flex-col h-[280px] flex-shrink-0">
          <SectionHeader 
            title="Available Periods" 
            count={availablePeriods.length}
            actions={
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={manualEntry.openForNew}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEventSelectionOpen(true)}>
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            }
          />
          
          <div className="relative mb-3">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search periods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            {availablePeriods.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No periods available. Add manual entries or import from events.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="h-8">
                      <TableHead className="h-8 py-1 text-xs font-semibold text-foreground">Plant/Machine</TableHead>
                      <TableHead className="h-8 py-1 text-xs font-semibold text-foreground">Period</TableHead>
                      <TableHead className="h-8 py-1 text-xs font-semibold text-foreground">Label</TableHead>
                      <TableHead className="h-8 py-1 text-xs font-semibold text-foreground">Event</TableHead>
                      <TableHead className="h-8 py-1 text-xs text-right w-[30px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedAvailablePeriods.map((period) => {
                      const startDate = new Date(period.start)
                      const endDate = new Date(period.end)
                      const startDateStr = startDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
                      const endDateStr = endDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
                      const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      
                      return (
                        <TableRow 
                          key={period.id}
                          className="h-8"
                        >
                          <TableCell className="py-1 px-2">
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs h-5 px-1">
                                {period.plant}
                              </Badge>
                              <Badge variant="secondary" className="text-xs h-5 px-1">
                                {period.machineNo}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-2 text-xs">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">S:</span>
                                <span className="text-foreground">{startDateStr} {startTime}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">E:</span>
                                <span className="text-foreground">{endDateStr} {endTime}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-2 text-xs font-medium">{period.label}</TableCell>
                          <TableCell className="py-1 px-2 text-xs">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{period.event}</span>
                              {period.eventDetail && (
                                <span className="text-[10px] text-muted-foreground">{period.eventDetail}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="p-1 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleAction('edit', period, 'available')}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('duplicate', period, 'available')}>
                                  <Layers className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleAction('remove', period, 'available')} 
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
          
          <Separator className="my-3" />
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleApplyFilter}
              disabled={availablePeriods.length === 0}
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Signal Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                // Add all displayed periods to selected data sources
                const newItems = [...selectedDataSourceItems]
                const periodsToAdd = displayedAvailablePeriods.filter(period => 
                  !newItems.find(item => item.id === period.id)
                )
                
                newItems.push(...periodsToAdd)
                setSelectedDataSourceItems(newItems)
                
                // Track sources
                const newSources = new Map(itemSources)
                periodsToAdd.forEach(p => newSources.set(p.id, 'available'))
                setItemSources(newSources)
                
                // Remove added periods from available periods
                const addedIds = new Set(periodsToAdd.map(p => p.id))
                setAvailablePeriods(availablePeriods.filter(p => !addedIds.has(p.id)))
              }}
              disabled={availablePeriods.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add All DataSource
            </Button>
          </div>
        </Card>

        {/* Filtered Results */}
        {filterActive && (
          <Card className="p-4 border-orange-200 bg-orange-50/50 h-[220px] flex-shrink-0">
            <SectionHeader 
              title="Filtered Results" 
              count={filteredPeriods.length}
              actions={
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleClearFilter}
                >
                  Clear
                </Button>
              }
            />
            
            <div className="border rounded-lg overflow-hidden">
              <ScrollArea className="h-[150px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="h-8">
                      <TableHead className="w-[35px] h-8 p-2">
                        <Checkbox 
                          checked={selectedFilteredRows.size === filteredPeriods.length && filteredPeriods.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFilteredRows(new Set(filteredPeriods.map(p => p.id)))
                            } else {
                              setSelectedFilteredRows(new Set())
                            }
                          }}
                          className="h-3.5 w-3.5"
                        />
                      </TableHead>
                      <TableHead className="h-8 py-1 text-xs font-semibold text-foreground">Plant/Machine</TableHead>
                      <TableHead className="h-8 py-1 text-xs font-semibold text-foreground">Period</TableHead>
                      <TableHead className="h-8 py-1 text-xs font-semibold text-foreground">Label</TableHead>
                      <TableHead className="h-8 py-1 text-xs font-semibold text-foreground">Event</TableHead>
                      <TableHead className="h-8 py-1 text-xs text-right w-[30px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPeriods.map((period) => {
                      const startDate = new Date(period.start)
                      const endDate = new Date(period.end)
                      const startDateStr = startDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
                      const endDateStr = endDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
                      const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      
                      return (
                        <TableRow 
                          key={period.id}
                          className="h-8 bg-orange-50"
                        >
                          <TableCell className="p-2">
                            <Checkbox 
                              checked={selectedFilteredRows.has(period.id)}
                              onCheckedChange={(checked) => {
                                const newSelected = new Set(selectedFilteredRows)
                                if (checked) {
                                  newSelected.add(period.id)
                                } else {
                                  newSelected.delete(period.id)
                                }
                                setSelectedFilteredRows(newSelected)
                              }}
                              className="h-3.5 w-3.5"
                            />
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs h-5 px-1 border-orange-200">
                                {period.plant}
                              </Badge>
                              <Badge variant="secondary" className="text-xs h-5 px-1 bg-orange-100">
                                {period.machineNo}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-2 text-xs">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">S:</span>
                                <span className="text-foreground">{startDateStr} {startTime}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">E:</span>
                                <span className="text-foreground">{endDateStr} {endTime}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-2 text-xs font-medium">{period.label}</TableCell>
                          <TableCell className="py-1 px-2 text-xs">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{period.event}</span>
                              {period.eventDetail && (
                                <span className="text-[10px] text-muted-foreground">{period.eventDetail}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="p-1 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleAction('edit', period, 'filtered')}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('duplicate', period, 'filtered')}>
                                  <Layers className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleAction('remove', period, 'filtered')} 
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 text-xs text-orange-700">
                <AlertCircle className="h-3 w-3" />
                <span>Signal patterns detected in {filteredPeriods.length} periods</span>
              </div>
              {selectedFilteredRows.size > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Add selected filtered periods to data sources
                    const newItems = [...selectedDataSourceItems]
                    const periodsToAdd = filteredPeriods.filter(p => 
                      selectedFilteredRows.has(p.id) && !newItems.find(item => item.id === p.id)
                    )
                    
                    newItems.push(...periodsToAdd)
                    setSelectedDataSourceItems(newItems)
                    
                    // Track sources
                    const newSources = new Map(itemSources)
                    periodsToAdd.forEach(p => newSources.set(p.id, 'filtered'))
                    setItemSources(newSources)
                    
                    // Remove added periods from filtered periods
                    const addedIds = new Set(periodsToAdd.map(p => p.id))
                    setFilteredPeriods(filteredPeriods.filter(p => !addedIds.has(p.id)))
                    
                    // Also remove from available periods if they exist there
                    setAvailablePeriods(availablePeriods.filter(p => !addedIds.has(p.id)))
                    
                    setSelectedFilteredRows(new Set()) // Clear selection after adding
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Selected ({selectedFilteredRows.size})
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Selected Data Sources */}
        <Card 
          className="p-4 border-primary/20 bg-primary/5 flex flex-col flex-1"
        >
          <SectionHeader 
            title="Selected Data Sources" 
            count={selectedDataSourceItems.length}
            actions={
              selectedDataSourceItems.length > 0 && (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )
            }
          />
          
          <div className="border rounded-lg overflow-hidden flex-1 flex flex-col">
            {selectedDataSourceItems.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6 text-primary/60" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Add periods from the sections above
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow className="h-8">
                      <TableHead className="h-8 py-1 text-xs font-semibold text-foreground">Plant/Machine</TableHead>
                      <TableHead className="h-8 py-1 text-xs font-semibold text-foreground">Period</TableHead>
                      <TableHead className="h-8 py-1 text-xs font-semibold text-foreground">Label</TableHead>
                      <TableHead className="h-8 py-1 text-xs font-semibold text-foreground">Event</TableHead>
                      <TableHead className="h-8 py-1 text-xs text-right w-[30px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDataSourceItems.map((period) => {
                      const startDate = new Date(period.start)
                      const endDate = new Date(period.end)
                      const startDateStr = startDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
                      const endDateStr = endDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
                      const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      
                      return (
                        <TableRow 
                          key={period.id}
                          className="h-8 bg-primary/5"
                        >
                          <TableCell className="py-1 px-2">
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs h-5 px-1 border-primary/20">
                                {period.plant}
                              </Badge>
                              <Badge variant="secondary" className="text-xs h-5 px-1 bg-primary/10">
                                {period.machineNo}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-2 text-xs">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">S:</span>
                                <span className="text-foreground">{startDateStr} {startTime}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">E:</span>
                                <span className="text-foreground">{endDateStr} {endTime}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-2 text-xs font-medium">{period.label}</TableCell>
                          <TableCell className="py-1 px-2 text-xs">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{period.event}</span>
                              {period.eventDetail && (
                                <span className="text-[10px] text-muted-foreground">{period.eventDetail}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="p-1 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  // Remove from selected and add back to source
                                  setSelectedDataSourceItems(selectedDataSourceItems.filter(p => p.id !== period.id))
                                  
                                  // Get the source and restore to appropriate list
                                  const source = itemSources.get(period.id)
                                  if (source === 'filtered' && filterActive) {
                                    // Return to filtered results if filter is still active
                                    setFilteredPeriods([...filteredPeriods, period])
                                  } else {
                                    // Return to available periods
                                    setAvailablePeriods([...availablePeriods, period])
                                  }
                                  
                                  // Remove from source tracking
                                  const newSources = new Map(itemSources)
                                  newSources.delete(period.id)
                                  setItemSources(newSources)
                                }}
                                title="Return to source"
                              >
                                <Undo2 className="h-3 w-3" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleAction('edit', period, 'selected')}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction('duplicate', period, 'selected')}>
                                    <Layers className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleAction('remove', period, 'selected')} 
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
          
          {selectedDataSourceItems.length > 0 && (
            <>
              <Separator className="my-3" />
              <TimeOffsetSettings
                startOffset={startOffset}
                setStartOffset={setStartOffset}
                startOffsetUnit={startOffsetUnit}
                setStartOffsetUnit={setStartOffsetUnit}
                endOffset={endOffset}
                setEndOffset={setEndOffset}
                endOffsetUnit={endOffsetUnit}
                setEndOffsetUnit={setEndOffsetUnit}
                offsetSectionOpen={offsetSectionOpen}
                setOffsetSectionOpen={setOffsetSectionOpen}
              />
            </>
          )}
        </Card>
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

      <EventSelectionDialog
        isOpen={eventSelectionOpen}
        onClose={() => setEventSelectionOpen(false)}
        events={events}
        onAddEvents={handleAddEventsToPool}
      />

      <TriggerSignalDialog
        isOpen={triggerSignalDialogOpen}
        onClose={() => setTriggerSignalDialogOpen(false)}
        onApplyConditions={handleApplyConditions}
        selectedDataSourceItems={availablePeriods}
      />
    </>
  )
}