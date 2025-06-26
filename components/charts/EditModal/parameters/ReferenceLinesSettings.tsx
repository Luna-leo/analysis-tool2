"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"
import { ChartComponent, EventInfo } from "@/types"
import { ReferenceLineRow, ReferenceLineConfig } from "./ReferenceLineRow"
import { useReferenceLinesDefaults } from "./useReferenceLinesDefaults"

interface ReferenceLinesSettingsProps {
  editingChart: ChartComponent
  referenceLines: ReferenceLineConfig[]
  onUpdateReferenceLines: (lines: ReferenceLineConfig[]) => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  selectedDataSourceItems: EventInfo[]
}

export function ReferenceLinesSettings({ 
  editingChart, 
  referenceLines, 
  onUpdateReferenceLines, 
  isOpen = false,
  onOpenChange,
  selectedDataSourceItems 
}: ReferenceLinesSettingsProps) {
  
  const { getDefaultValues } = useReferenceLinesDefaults(editingChart, selectedDataSourceItems)

  const handleAddVerticalLine = () => {
    onOpenChange?.(true)
    const { defaultXValue } = getDefaultValues()
    
    // Count existing vertical lines to generate unique label
    const verticalLineCount = referenceLines.filter(line => line.type === "vertical").length
    const defaultLabel = `V-Line ${verticalLineCount + 1}`
    
    const newReferenceLine: ReferenceLineConfig = {
      id: Date.now().toString(),
      type: "vertical",
      label: defaultLabel,
      xValue: defaultXValue,
      yValue: "",
      axisNo: 1,
    }
    onUpdateReferenceLines([...referenceLines, newReferenceLine])
  }

  const handleAddHorizontalLine = () => {
    onOpenChange?.(true)
    const { defaultYValue } = getDefaultValues()
    
    // Count existing horizontal lines to generate unique label
    const horizontalLineCount = referenceLines.filter(line => line.type === "horizontal").length
    const defaultLabel = `H-Line ${horizontalLineCount + 1}`
    
    const newReferenceLine: ReferenceLineConfig = {
      id: Date.now().toString(),
      type: "horizontal",
      label: defaultLabel,
      xValue: "",
      yValue: defaultYValue,
      axisNo: 1,
    }
    onUpdateReferenceLines([...referenceLines, newReferenceLine])
  }

  const handleUpdateReferenceLine = (id: string, field: keyof ReferenceLineConfig, value: any) => {
    onUpdateReferenceLines(referenceLines.map(line => {
      if (line.id !== id) return line
      
      const updatedLine = { ...line, [field]: value }
      
      return updatedLine
    }))
  }

  const handleRemoveReferenceLine = (id: string) => {
    onUpdateReferenceLines(referenceLines.filter(line => line.id !== id))
  }

  return (
    <div className="border rounded-lg bg-muted/30">
      <Collapsible open={isOpen} onOpenChange={onOpenChange} className="w-full">
        <div className="flex items-center gap-2 p-3 border-b bg-muted/20 relative z-20">
          <CollapsibleTrigger className="flex items-center gap-2 text-left hover:bg-muted/50 transition-colors p-1 rounded">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <h4 className="font-medium text-sm">Reference Lines Settings</h4>
          </CollapsibleTrigger>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                handleAddVerticalLine()
              }}
            >
              Add Vertical Line
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                handleAddHorizontalLine()
              }}
            >
              Add Horizontal Line
            </Button>
          </div>
        </div>
        <CollapsibleContent>
          <div className="px-3 pb-3">
            <div className="pt-3 border-t">
              <div className="flex gap-2 mb-1 px-1 text-xs font-medium text-muted-foreground border-b pb-1 mt-1">
                <div className="w-16">Type</div>
                <div className="flex-1">Label</div>
                <div className="w-40">Value</div>
                <div className="w-16">Axis No</div>
                <div className="w-7"></div>
              </div>

              <div className="max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {referenceLines.map((line) => (
                    <ReferenceLineRow
                      key={line.id}
                      line={line}
                      editingChart={editingChart}
                      onUpdateReferenceLine={handleUpdateReferenceLine}
                      onRemoveReferenceLine={handleRemoveReferenceLine}
                    />
                  ))}

                  {referenceLines.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p className="text-sm">No reference lines added yet.</p>
                      <p className="text-sm">Click "Add Vertical Line" or "Add Horizontal Line" to create one.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}