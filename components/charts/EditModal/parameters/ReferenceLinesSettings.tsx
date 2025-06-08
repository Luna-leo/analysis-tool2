"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { X, ChevronDown, ChevronRight } from "lucide-react"
import { ChartComponent } from "@/types"

interface ReferenceLineConfig {
  id: string
  type: "vertical" | "horizontal"
  label: string
  xValue?: string
  yValue?: string
  axisNo?: number
  yRange?: {
    auto: boolean
    min: string
    max: string
  }
  xRange?: {
    auto: boolean
    min: string
    max: string
  }
}

interface ReferenceLinesSettingsProps {
  editingChart: ChartComponent
  referenceLines: ReferenceLineConfig[]
  onUpdateReferenceLines: (lines: ReferenceLineConfig[]) => void
}

export function ReferenceLinesSettings({ editingChart, referenceLines, onUpdateReferenceLines }: ReferenceLinesSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleAddReferenceLine = () => {
    setIsOpen(true)
    const newReferenceLine: ReferenceLineConfig = {
      id: Date.now().toString(),
      type: "vertical",
      label: "",
      xValue: "",
      yValue: "",
      axisNo: 1,
      yRange: {
        auto: true,
        min: "0",
        max: "100"
      },
      xRange: {
        auto: true,
        min: "0",
        max: "100"
      }
    }
    onUpdateReferenceLines([...referenceLines, newReferenceLine])
  }

  const handleUpdateReferenceLine = (id: string, field: keyof ReferenceLineConfig, value: any) => {
    onUpdateReferenceLines(referenceLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ))
  }

  const handleUpdateRange = (id: string, rangeType: 'xRange' | 'yRange', field: keyof ReferenceLineConfig['xRange'], value: any) => {
    onUpdateReferenceLines(referenceLines.map(line => {
      if (line.id !== id) return line
      return {
        ...line,
        [rangeType]: {
          ...line[rangeType],
          [field]: value
        }
      }
    }))
  }

  const handleRemoveReferenceLine = (id: string) => {
    onUpdateReferenceLines(referenceLines.filter(line => line.id !== id))
  }

  return (
    <div className="border rounded-lg bg-muted/30">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-2 p-3">
          <CollapsibleTrigger className="flex items-center gap-2 text-left hover:bg-muted/50 transition-colors p-1 rounded">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <h4 className="font-medium text-sm">Reference Lines Settings</h4>
          </CollapsibleTrigger>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs ml-auto"
            onClick={() => {
              handleAddReferenceLine()
            }}
          >
            Add Reference Line
          </Button>
        </div>
        <CollapsibleContent>
          <div className="px-3 pb-3">

      <div className="flex gap-2 mb-2 px-1 pb-1 border-b">
        <div className="w-20 text-xs font-medium text-muted-foreground">Type</div>
        <div className="flex-1 text-xs font-medium text-muted-foreground">Label</div>
        <div className="w-24 text-xs font-medium text-muted-foreground">Value</div>
        <div className="w-16 text-xs font-medium text-muted-foreground">Axis No</div>
        <div className="w-24 text-xs font-medium text-muted-foreground">Range</div>
        <div className="w-7"></div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {referenceLines.map((line) => (
          <div key={line.id} className="flex gap-2 p-1">
            <div className="w-24">
              <select
                value={line.type}
                onChange={(e) => handleUpdateReferenceLine(line.id, "type", e.target.value)}
                className="w-full h-7 px-2 py-1 border rounded-md text-xs"
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </div>
            <div className="flex-1">
              <Input
                value={line.label}
                onChange={(e) => handleUpdateReferenceLine(line.id, "label", e.target.value)}
                placeholder="Label"
                className="h-7 text-xs"
              />
            </div>
            <div className="w-24">
              {line.type === "vertical" ? (
                editingChart.xAxisType === "datetime" ? (
                  <Input
                    type="datetime-local"
                    value={line.xValue || ""}
                    onChange={(e) => handleUpdateReferenceLine(line.id, "xValue", e.target.value)}
                    className="h-7 text-xs"
                  />
                ) : (
                  <Input
                    type="number"
                    value={line.xValue || ""}
                    onChange={(e) => handleUpdateReferenceLine(line.id, "xValue", e.target.value)}
                    placeholder={editingChart.xAxisType === "time" ? "Time(s)" : "X value"}
                    className="h-7 text-xs"
                  />
                )
              ) : (
                <Input
                  type="number"
                  value={line.yValue || ""}
                  onChange={(e) => handleUpdateReferenceLine(line.id, "yValue", e.target.value)}
                  placeholder="Y value"
                  className="h-7 text-xs"
                />
              )}
            </div>
            <div className="w-16">
              {line.type === "horizontal" ? (
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={line.axisNo || 1}
                  onChange={(e) => handleUpdateReferenceLine(line.id, "axisNo", parseInt(e.target.value) || 1)}
                  className="h-7 text-xs"
                />
              ) : (
                <div className="h-7" />
              )}
            </div>
            <div className="w-24">
              {line.type === "vertical" ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-7 w-full justify-start text-xs">
                      {line.yRange?.auto ? "Range: Auto" : `Range: ${line.yRange?.min || 0} - ${line.yRange?.max || 100}`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`y-auto-${line.id}`}
                          checked={line.yRange?.auto ?? true}
                          onCheckedChange={(checked) => handleUpdateRange(line.id, 'yRange', 'auto', checked)}
                        />
                        <Label htmlFor={`y-auto-${line.id}`} className="text-sm">Auto Range</Label>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor={`y-min-${line.id}`} className="text-xs">Min Value</Label>
                          <Input
                            id={`y-min-${line.id}`}
                            type="number"
                            value={line.yRange?.min || "0"}
                            onChange={(e) => handleUpdateRange(line.id, 'yRange', 'min', e.target.value)}
                            disabled={line.yRange?.auto ?? true}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`y-max-${line.id}`} className="text-xs">Max Value</Label>
                          <Input
                            id={`y-max-${line.id}`}
                            type="number"
                            value={line.yRange?.max || "100"}
                            onChange={(e) => handleUpdateRange(line.id, 'yRange', 'max', e.target.value)}
                            disabled={line.yRange?.auto ?? true}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-7 w-full justify-start text-xs">
                      {line.xRange?.auto ? "Range: Auto" : `Range: ${line.xRange?.min || 0} - ${line.xRange?.max || 100}`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`x-auto-${line.id}`}
                          checked={line.xRange?.auto ?? true}
                          onCheckedChange={(checked) => handleUpdateRange(line.id, 'xRange', 'auto', checked)}
                        />
                        <Label htmlFor={`x-auto-${line.id}`} className="text-sm">Auto Range</Label>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor={`x-min-${line.id}`} className="text-xs">Min Value</Label>
                          {editingChart.xAxisType === "datetime" ? (
                            <Input
                              id={`x-min-${line.id}`}
                              type="datetime-local"
                              value={line.xRange?.min || ""}
                              onChange={(e) => handleUpdateRange(line.id, 'xRange', 'min', e.target.value)}
                              disabled={line.xRange?.auto ?? true}
                              className="h-8"
                            />
                          ) : (
                            <Input
                              id={`x-min-${line.id}`}
                              type="number"
                              value={line.xRange?.min || "0"}
                              onChange={(e) => handleUpdateRange(line.id, 'xRange', 'min', e.target.value)}
                              disabled={line.xRange?.auto ?? true}
                              placeholder={editingChart.xAxisType === "time" ? "Start(s)" : "Min"}
                              className="h-8"
                            />
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`x-max-${line.id}`} className="text-xs">Max Value</Label>
                          {editingChart.xAxisType === "datetime" ? (
                            <Input
                              id={`x-max-${line.id}`}
                              type="datetime-local"
                              value={line.xRange?.max || ""}
                              onChange={(e) => handleUpdateRange(line.id, 'xRange', 'max', e.target.value)}
                              disabled={line.xRange?.auto ?? true}
                              className="h-8"
                            />
                          ) : (
                            <Input
                              id={`x-max-${line.id}`}
                              type="number"
                              value={line.xRange?.max || "100"}
                              onChange={(e) => handleUpdateRange(line.id, 'xRange', 'max', e.target.value)}
                              disabled={line.xRange?.auto ?? true}
                              placeholder={editingChart.xAxisType === "time" ? "End(s)" : "Max"}
                              className="h-8"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className="w-7">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveReferenceLine(line.id)}
                className="h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {referenceLines.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="text-sm">No reference lines added yet.</p>
          <p className="text-sm">Click "Add Reference Line" to create one.</p>
        </div>
      )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}