"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Calendar, 
  Filter, 
  ChevronRight, 
  Clock, 
  Factory, 
  Tag,
  MoreVertical,
  Edit,
  Trash2,
  ArrowRight,
  Check,
  X,
  Search,
  Database
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { EventInfo } from "@/types"

interface DataSourceTabRedesignProps {
  selectedDataSourceItems: EventInfo[]
  setSelectedDataSourceItems: React.Dispatch<React.SetStateAction<EventInfo[]>>
}

// ステップインジケーター
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, label: "Collect", icon: Database },
    { id: 2, label: "Filter", icon: Filter },
    { id: 3, label: "Select", icon: Check }
  ]

  return (
    <div className="flex items-center justify-between mb-6 px-4">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = currentStep === step.id
        const isCompleted = currentStep > step.id
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && "bg-green-500 text-white",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={cn(
                "text-xs mt-1 font-medium",
                isActive && "text-primary",
                isCompleted && "text-green-600",
                !isActive && !isCompleted && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className={cn(
                "h-4 w-4 mx-2",
                currentStep > step.id ? "text-green-500" : "text-muted-foreground"
              )} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// コンパクトな期間カード
function PeriodCard({ 
  period, 
  isSelected, 
  onToggle, 
  onEdit, 
  onRemove,
  showActions = true 
}: {
  period: EventInfo
  isSelected?: boolean
  onToggle?: () => void
  onEdit?: () => void
  onRemove?: () => void
  showActions?: boolean
}) {
  return (
    <Card className={cn(
      "p-3 cursor-pointer transition-all hover:shadow-md",
      isSelected && "ring-2 ring-primary bg-primary/5"
    )} onClick={onToggle}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {period.plant}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {period.machineNo}
            </Badge>
          </div>
          <h4 className="font-medium text-sm truncate">{period.label}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {period.labelDescription}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(period.start).toLocaleDateString()}</span>
            <span>•</span>
            <span>
              {new Date(period.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {new Date(period.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onEdit?.()
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onRemove?.()
              }} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  )
}

export function DataSourceTabRedesign({
  selectedDataSourceItems,
  setSelectedDataSourceItems,
}: DataSourceTabRedesignProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [periodPool, setPeriodPool] = useState<EventInfo[]>([])
  const [selectedPoolIds, setSelectedPoolIds] = useState<Set<string>>(new Set())
  const [filteredResults, setFilteredResults] = useState<EventInfo[]>([])
  
  // Step 1: Collect periods
  const handleAddManualEntry = () => {
    console.log("Add manual entry")
  }

  const handleAddFromEvents = () => {
    console.log("Add from events")
  }

  // Step 2: Filter periods
  const handleApplyFilters = () => {
    // Simulate filtering
    setFilteredResults(periodPool.filter(p => selectedPoolIds.has(p.id)))
    setCurrentStep(3)
  }

  // Step 3: Add to data source
  const handleAddToDataSource = () => {
    const newItems = [...selectedDataSourceItems]
    filteredResults.forEach((item) => {
      if (!newItems.find((existing) => existing.id === item.id)) {
        newItems.push(item)
      }
    })
    setSelectedDataSourceItems(newItems)
    // Reset
    setFilteredResults([])
    setSelectedPoolIds(new Set())
    setCurrentStep(1)
  }

  return (
    <div className="h-full flex flex-col">
      {/* ステップインジケーター */}
      <StepIndicator currentStep={currentStep} />
      
      {/* メインコンテンツ */}
      <div className="flex-1 px-4">
        {/* Step 1: Collect */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Collect Periods</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleAddManualEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Manual
                </Button>
                <Button size="sm" variant="outline" onClick={handleAddFromEvents}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Events
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="signals">Signals</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {periodPool.filter(p => p.id.startsWith('manual_')).map((period) => (
                      <PeriodCard
                        key={period.id}
                        period={period}
                        isSelected={selectedPoolIds.has(period.id)}
                        onToggle={() => {
                          const newSet = new Set(selectedPoolIds)
                          if (newSet.has(period.id)) {
                            newSet.delete(period.id)
                          } else {
                            newSet.add(period.id)
                          }
                          setSelectedPoolIds(newSet)
                        }}
                        onEdit={() => console.log("Edit", period)}
                        onRemove={() => setPeriodPool(periodPool.filter(p => p.id !== period.id))}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="events" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {periodPool.filter(p => !p.id.startsWith('manual_') && !p.id.startsWith('trigger_')).map((period) => (
                      <PeriodCard
                        key={period.id}
                        period={period}
                        isSelected={selectedPoolIds.has(period.id)}
                        onToggle={() => {
                          const newSet = new Set(selectedPoolIds)
                          if (newSet.has(period.id)) {
                            newSet.delete(period.id)
                          } else {
                            newSet.add(period.id)
                          }
                          setSelectedPoolIds(newSet)
                        }}
                        onEdit={() => console.log("Edit", period)}
                        onRemove={() => setPeriodPool(periodPool.filter(p => p.id !== period.id))}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="signals" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No signal-based periods yet</p>
                  <p className="text-xs">Use filters to detect signal patterns</p>
                </div>
              </TabsContent>
            </Tabs>
            
            {selectedPoolIds.size > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {selectedPoolIds.size} periods selected
                </span>
                <Button onClick={() => setCurrentStep(2)}>
                  Next: Apply Filters
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Step 2: Filter */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Apply Filters</h3>
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
            </div>
            
            <Card className="p-4">
              <h4 className="font-medium mb-3">Selected Periods ({selectedPoolIds.size})</h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {periodPool.filter(p => selectedPoolIds.has(p.id)).map((period) => (
                    <PeriodCard
                      key={period.id}
                      period={period}
                      showActions={false}
                    />
                  ))}
                </div>
              </ScrollArea>
            </Card>
            
            <Card className="p-4">
              <h4 className="font-medium mb-3">Filter Conditions</h4>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Add conditions to detect signal patterns within the selected periods
                </p>
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Configure Filter Conditions
                </Button>
              </div>
            </Card>
            
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleApplyFilters} className="flex-1">
                Apply Filters
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 3: Select */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Review & Add</h3>
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
            </div>
            
            <Card className="p-4">
              <h4 className="font-medium mb-3">Results to Add ({filteredResults.length})</h4>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredResults.map((period) => (
                    <PeriodCard
                      key={period.id}
                      period={period}
                      showActions={false}
                    />
                  ))}
                </div>
              </ScrollArea>
            </Card>
            
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleAddToDataSource} className="flex-1">
                Add to Data Source
                <Check className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* 現在選択されているデータソース（常に表示） */}
      <div className="border-t pt-4 px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Active Data Sources</h4>
          <Badge variant="secondary">{selectedDataSourceItems.length}</Badge>
        </div>
        {selectedDataSourceItems.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {selectedDataSourceItems.slice(0, 3).map((item) => (
              <Badge key={item.id} variant="outline" className="text-xs">
                {item.label}
              </Badge>
            ))}
            {selectedDataSourceItems.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{selectedDataSourceItems.length - 3} more
              </Badge>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No data sources selected</p>
        )}
      </div>
    </div>
  )
}