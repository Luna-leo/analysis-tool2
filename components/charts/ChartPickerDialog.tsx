"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ChartComponent, EventInfo, DataSourceStyle } from "@/types"
import { ChartPreviewGraph } from "./ChartPreviewGraph"
import { Check } from "lucide-react"

interface ChartPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  charts: ChartComponent[]
  excludedChartIds: Set<string>
  selectedDataSources?: EventInfo[]
  dataSourceStyles?: { [dataSourceId: string]: DataSourceStyle }
  onSelect: (chart: ChartComponent) => void
  title?: string
  description?: string
}

export function ChartPickerDialog({
  open,
  onOpenChange,
  charts,
  excludedChartIds,
  selectedDataSources = [],
  dataSourceStyles = {},
  onSelect,
  title = "Select Source Chart",
  description = "Select a chart to copy settings from:"
}: ChartPickerDialogProps) {
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null)
  
  const availableCharts = charts.filter(chart => !excludedChartIds.has(chart.id))
  
  const handleSelect = () => {
    const selectedChart = charts.find(c => c.id === selectedChartId)
    if (selectedChart) {
      onSelect(selectedChart)
      setSelectedChartId(null)
      onOpenChange(false)
    }
  }
  
  const handleClose = () => {
    setSelectedChartId(null)
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="grid grid-cols-3 gap-4 py-4">
            {availableCharts.map((chart) => (
              <div
                key={chart.id}
                className={cn(
                  "relative border rounded-lg overflow-hidden cursor-pointer transition-all",
                  "hover:border-primary hover:shadow-md",
                  selectedChartId === chart.id 
                    ? "ring-2 ring-primary border-primary" 
                    : "border-border"
                )}
                onClick={() => setSelectedChartId(chart.id)}
              >
                {/* Selection indicator */}
                {selectedChartId === chart.id && (
                  <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                
                {/* Chart preview */}
                <div className="h-40 bg-white">
                  <ChartPreviewGraph
                    editingChart={chart}
                    selectedDataSourceItems={selectedDataSources}
                    dataSourceStyles={dataSourceStyles}
                    isCompact={true}
                  />
                </div>
                
                {/* Chart title */}
                <div className="p-2 bg-background border-t">
                  <p className="text-sm font-medium truncate">{chart.title}</p>
                  {chart.yAxisParams && chart.yAxisParams.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {chart.yAxisParams.length} parameter{chart.yAxisParams.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {availableCharts.length === 0 && (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                No available charts to select from
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSelect}
            disabled={!selectedChartId}
          >
            Select Chart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}