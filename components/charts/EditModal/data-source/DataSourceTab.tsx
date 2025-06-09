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
  Tag,
  MoreHorizontal,
  Edit2,
  Trash2,
  Search,
  GripVertical,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Layers
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
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

// ミニマルな期間アイテム
function PeriodItem({ 
  period, 
  variant = "default",
  onAction,
  isDragging = false
}: {
  period: EventInfo
  variant?: "default" | "selected" | "filtered"
  onAction?: (action: string) => void
  isDragging?: boolean
}) {
  const variantStyles = {
    default: "hover:bg-accent",
    selected: "bg-primary/10 border-primary/20",
    filtered: "bg-orange-50 border-orange-200"
  }

  return (
    <div className={cn(
      "group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-move",
      variantStyles[variant],
      isDragging && "opacity-50"
    )}>
      <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{period.label}</span>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs h-5">
              {period.plant}
            </Badge>
            <Badge variant="secondary" className="text-xs h-5">
              {period.machineNo}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {new Date(period.start).toLocaleDateString()} 
            {' '}
            {new Date(period.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {new Date(period.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onAction?.('edit')}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction?.('duplicate')}>
            <Layers className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction?.('remove')} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
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

// ドロップゾーン
function DropZone({ 
  isActive, 
  isEmpty, 
  label 
}: { 
  isActive: boolean
  isEmpty: boolean
  label: string 
}) {
  if (!isEmpty && !isActive) return null

  return (
    <div className={cn(
      "border-2 border-dashed rounded-lg p-8 text-center transition-all",
      isActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
      !isEmpty && "absolute inset-0 z-10 bg-background/80"
    )}>
      <p className="text-sm text-muted-foreground">{label}</p>
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, period: EventInfo, source: string) => {
    e.dataTransfer.setData("period", JSON.stringify(period))
    e.dataTransfer.setData("source", source)
  }

  const handleDrop = (e: React.DragEvent, target: string) => {
    e.preventDefault()
    const period = JSON.parse(e.dataTransfer.getData("period"))
    const source = e.dataTransfer.getData("source")
    
    if (target === "selected" && source !== "selected") {
      if (!selectedDataSourceItems.find(item => item.id === period.id)) {
        setSelectedDataSourceItems([...selectedDataSourceItems, period])
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

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
      <div className="h-full flex flex-col gap-4">
        {/* Available Periods */}
        <Card className="flex-1 p-4">
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
          
          <ScrollArea className="h-[180px]">
            <div className="space-y-1 relative">
              <DropZone 
                isActive={false} 
                isEmpty={availablePeriods.length === 0}
                label="No periods available. Add manual entries or import from events."
              />
              {displayedAvailablePeriods.map((period) => (
                <div
                  key={period.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, period, "available")}
                >
                  <PeriodItem 
                    period={period} 
                    onAction={(action) => handleAction(action, period, "available")}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <Separator className="my-3" />
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleApplyFilter}
            disabled={availablePeriods.length === 0}
          >
            <Filter className="h-4 w-4 mr-2" />
            Apply Signal Filter
          </Button>
        </Card>

        {/* Filtered Results */}
        {filterActive && (
          <Card className="p-4 border-orange-200 bg-orange-50/50">
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
            
            <div className="space-y-1">
              {filteredPeriods.map((period) => (
                <div
                  key={period.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, period, "filtered")}
                >
                  <PeriodItem 
                    period={period} 
                    variant="filtered"
                    onAction={(action) => handleAction(action, period, "filtered")}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2 mt-3 text-xs text-orange-700">
              <AlertCircle className="h-3 w-3" />
              <span>Signal patterns detected in {filteredPeriods.length} periods</span>
            </div>
          </Card>
        )}

        {/* Visual Separator with Arrow */}
        <div className="flex items-center justify-center py-2">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Selected Data Sources */}
        <Card 
          className="flex-1 p-4 border-primary/20 bg-primary/5"
          onDrop={(e) => handleDrop(e, "selected")}
          onDragOver={handleDragOver}
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
          
          <ScrollArea className="h-[200px]">
            <div className="space-y-1 relative min-h-[100px]">
              <DropZone 
                isActive={false} 
                isEmpty={selectedDataSourceItems.length === 0}
                label="Drag periods here to use as data sources"
              />
              {selectedDataSourceItems.map((period) => (
                <PeriodItem 
                  key={period.id}
                  period={period} 
                  variant="selected"
                  onAction={(action) => handleAction(action, period, "selected")}
                />
              ))}
            </div>
          </ScrollArea>
          
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