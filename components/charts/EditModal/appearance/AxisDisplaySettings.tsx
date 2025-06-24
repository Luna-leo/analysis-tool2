"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChartComponent } from "@/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

interface AxisDisplaySettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function AxisDisplaySettings({ editingChart, setEditingChart }: AxisDisplaySettingsProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="px-4">
      <div className="border rounded-lg bg-muted/30">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="p-3">
            <CollapsibleTrigger className="flex items-center gap-2 text-left hover:bg-muted/50 transition-colors p-1 rounded w-full">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <h4 className="font-medium text-sm">Axis Display Settings</h4>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-4">
              {/* X-Axis Settings */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">X-Axis</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="x-axis-ticks" className="text-xs">Tick Count:</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            id="x-axis-ticks"
                            type="number"
                            min={2}
                            max={20}
                            value={editingChart.xAxisTicks || 5}
                            onChange={(e) => {
                              const value = parseInt(e.target.value)
                              if (!isNaN(value) && value >= 2 && value <= 20) {
                                setEditingChart({
                                  ...editingChart,
                                  xAxisTicks: value,
                                })
                              }
                            }}
                            className="h-8 w-20 text-sm"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of tick marks on X-axis (2-20)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {(editingChart.xAxisType === 'parameter' || editingChart.xAxisType === 'time') && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="x-axis-precision" className="text-xs">Decimal Places:</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              id="x-axis-precision"
                              type="number"
                              min={0}
                              max={10}
                              value={editingChart.xAxisTickPrecision ?? 2}
                              onChange={(e) => {
                                const value = parseInt(e.target.value)
                                if (!isNaN(value) && value >= 0 && value <= 10) {
                                  setEditingChart({
                                    ...editingChart,
                                    xAxisTickPrecision: value,
                                  })
                                }
                              }}
                              className="h-8 w-20 text-sm"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Number of decimal places in tick labels (0-10)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator className="my-3" />
              
              {/* Y-Axis Settings */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Y-Axis</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="y-axis-ticks" className="text-xs">Tick Count:</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            id="y-axis-ticks"
                            type="number"
                            min={2}
                            max={20}
                            value={editingChart.yAxisTicks || 5}
                            onChange={(e) => {
                              const value = parseInt(e.target.value)
                              if (!isNaN(value) && value >= 2 && value <= 20) {
                                setEditingChart({
                                  ...editingChart,
                                  yAxisTicks: value,
                                })
                              }
                            }}
                            className="h-8 w-20 text-sm"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of tick marks on Y-axis (2-20)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="y-axis-precision" className="text-xs">Decimal Places:</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            id="y-axis-precision"
                            type="number"
                            min={0}
                            max={10}
                            value={editingChart.yAxisTickPrecision ?? 2}
                            onChange={(e) => {
                              const value = parseInt(e.target.value)
                              if (!isNaN(value) && value >= 0 && value <= 10) {
                                setEditingChart({
                                  ...editingChart,
                                  yAxisTickPrecision: value,
                                })
                              }
                            }}
                            className="h-8 w-20 text-sm"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of decimal places in tick labels (0-10)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}