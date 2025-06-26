"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { InterlockDefinition, InterlockThreshold, EventInfo } from "@/types"
import { InterlockFormFields } from "./InterlockFormFields"
import { PlantMachineFields } from "./PlantMachineFields"
import { ThresholdColorSection } from "./ThresholdColorSection"
import { ThresholdPointsTable } from "./ThresholdPointsTable"
import { InterlockChart } from "./InterlockChart"

interface InterlockRegistrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (interlockDefinition: InterlockDefinition, selectedThresholds: string[], plant: string, machineNo: string) => void
  initialDefinition?: InterlockDefinition
  initialSelectedThresholds?: string[]
  initialPlant?: string
  initialMachineNo?: string
  mode?: "create" | "edit" | "duplicate"
  selectedDataSourceItems?: EventInfo[]
}

export function InterlockRegistrationDialog({
  open,
  onOpenChange,
  onSave,
  initialDefinition,
  initialSelectedThresholds,
  initialPlant,
  initialMachineNo,
  mode = "create",
  selectedDataSourceItems
}: InterlockRegistrationDialogProps) {
  const [name, setName] = useState(initialDefinition?.name || "")
  const [plant, setPlant] = useState(initialPlant || "")
  const [machineNo, setMachineNo] = useState(initialMachineNo || "")
  const [xParameter, setXParameter] = useState(initialDefinition?.xParameter || "")
  const [xUnit, setXUnit] = useState(initialDefinition?.xUnit || "")
  const [yUnit, setYUnit] = useState(initialDefinition?.yUnit || "")
  const [selectedThresholds, setSelectedThresholds] = useState<string[]>(initialSelectedThresholds || [])
  const chartContainerRef = React.useRef<HTMLDivElement>(null)
  const [chartSize, setChartSize] = useState({ width: 600, height: 400 })
  const [thresholds, setThresholds] = useState<InterlockThreshold[]>(
    initialDefinition?.thresholds || [
      {
        id: "threshold_1",
        name: "Caution",
        color: "#FFA500",
        points: [
          { x: 0, y: 2 },
          { x: 10, y: 5 },
          { x: 20, y: 5 },
          { x: 30, y: 60 },
          { x: 40, y: 60 },
          { x: 50, y: 80 }
        ]
      },
      {
        id: "threshold_2",
        name: "Alarm",
        color: "#FF0000",
        points: [
          { x: 0, y: 5 },
          { x: 10, y: 7 },
          { x: 20, y: 7 },
          { x: 30, y: 80 },
          { x: 40, y: 80 },
          { x: 50, y: 90 }
        ]
      }
    ]
  )
  const [lineType, setLineType] = useState<"linear" | "step" | "stepBefore" | "stepAfter">("linear")
  
  // Reset state when dialog opens with new initial values
  useEffect(() => {
    if (open) {
      setName(initialDefinition?.name || "")
      setPlant(initialPlant || "")
      setMachineNo(initialMachineNo || "")
      setXParameter(initialDefinition?.xParameter || "")
      setXUnit(initialDefinition?.xUnit || "")
      setYUnit(initialDefinition?.yUnit || "")
      setSelectedThresholds(initialSelectedThresholds || [])
      // Set default sample data for new interlock registration
      if (!initialDefinition) {
        setThresholds([
          {
            id: `threshold_${Date.now()}_1`,
            name: "Caution",
            color: "#FFA500",
            points: [
              { x: 0, y: 20 },
              { x: 50, y: 40 },
              { x: 100, y: 60 }
            ]
          },
          {
            id: `threshold_${Date.now()}_2`,
            name: "Alarm",
            color: "#FF0000",
            points: [
              { x: 0, y: 40 },
              { x: 50, y: 60 },
              { x: 100, y: 80 }
            ]
          }
        ])
      } else {
        setThresholds(initialDefinition.thresholds)
      }
    }
  }, [open, initialDefinition, initialSelectedThresholds, initialPlant, initialMachineNo])

  // Resize observer for dynamic chart sizing
  useEffect(() => {
    if (!chartContainerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setChartSize({
          width: Math.max(400, width - 4), // 4px for padding
          height: Math.max(300, height - 4)
        })
      }
    })

    resizeObserver.observe(chartContainerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const handleThresholdToggle = (thresholdId: string) => {
    setSelectedThresholds(prev => 
      prev.includes(thresholdId)
        ? prev.filter(id => id !== thresholdId)
        : [...prev, thresholdId]
    )
  }

  const handleSave = () => {
    const interlockDefinition: InterlockDefinition = {
      id: initialDefinition?.id || `interlock_${Date.now()}`,
      name,
      xParameter,
      xUnit,
      yUnit,
      thresholds
    }
    onSave(interlockDefinition, selectedThresholds, plant, machineNo)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[90vw] h-[95vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {mode === "edit" ? "Edit Interlock Definition" : 
             mode === "duplicate" ? "Duplicate Interlock Definition" : 
             "New Interlock Registration"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex gap-4">
          {/* Left Panel - Graph */}
          <div className="w-1/2 pr-2 flex flex-col min-h-0">
            <div className="shrink-0 mb-2">
              <PlantMachineFields
                plant={plant}
                onPlantChange={setPlant}
                machineNo={machineNo}
                onMachineNoChange={setMachineNo}
              />
            </div>
            <div ref={chartContainerRef} className="flex-1 min-h-0 bg-gray-50 rounded-lg p-1 flex items-center justify-center">
              <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                <InterlockChart
                  name={name}
                  xParameter={xParameter}
                  xUnit={xUnit}
                  yUnit={yUnit}
                  thresholds={thresholds}
                  lineType={lineType}
                  width={chartSize.width}
                  height={chartSize.height}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Form and Settings */}
          <div className="w-1/2 pl-2 flex flex-col min-h-0">
            <div className="shrink-0 space-y-2">
              <InterlockFormFields
                name={name}
                onNameChange={setName}
                xParameter={xParameter}
                onXParameterChange={setXParameter}
                xUnit={xUnit}
                onXUnitChange={setXUnit}
                yUnit={yUnit}
                onYUnitChange={setYUnit}
                selectedDataSourceItems={selectedDataSourceItems}
              />
              <div className="mt-2">
                <ThresholdColorSection
                  thresholds={thresholds}
                  onUpdateThresholds={setThresholds}
                />
              </div>
            </div>

            <div className="mt-2 flex-1 min-h-0">
              <ThresholdPointsTable
                thresholds={thresholds}
                onUpdateThresholds={setThresholds}
                xParameter={xParameter}
                xUnit={xUnit}
                lineType={lineType}
                onLineTypeChange={(value) => setLineType(value as "linear" | "step" | "stepBefore" | "stepAfter")}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !plant.trim() || !machineNo.trim()}>
            {mode === "edit" ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}