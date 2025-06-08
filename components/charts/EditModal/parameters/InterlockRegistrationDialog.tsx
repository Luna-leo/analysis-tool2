"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { InterlockDefinition, InterlockThreshold } from "@/types"
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
}

export function InterlockRegistrationDialog({
  open,
  onOpenChange,
  onSave,
  initialDefinition,
  initialSelectedThresholds,
  initialPlant,
  initialMachineNo,
  mode = "create"
}: InterlockRegistrationDialogProps) {
  const [name, setName] = useState(initialDefinition?.name || "")
  const [plant, setPlant] = useState(initialPlant || "")
  const [machineNo, setMachineNo] = useState(initialMachineNo || "")
  const [xParameter, setXParameter] = useState(initialDefinition?.xParameter || "")
  const [xUnit, setXUnit] = useState(initialDefinition?.xUnit || "")
  const [yUnit, setYUnit] = useState(initialDefinition?.yUnit || "")
  const [selectedThresholds, setSelectedThresholds] = useState<string[]>(initialSelectedThresholds || [])
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
      <DialogContent className="max-w-7xl w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Interlock Definition" : 
             mode === "duplicate" ? "Duplicate Interlock Definition" : 
             "New Interlock Registration"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Left Panel - Graph */}
          <div className="w-1/2 pr-2 flex flex-col">
            <PlantMachineFields
              plant={plant}
              onPlantChange={setPlant}
              machineNo={machineNo}
              onMachineNoChange={setMachineNo}
            />
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Interlock Graph</h4>
              <div className="flex items-center gap-2">
                <Label htmlFor="line-type" className="text-sm">Line Type</Label>
                <select
                  id="line-type"
                  value={lineType}
                  onChange={(e) => setLineType(e.target.value as "linear" | "step" | "stepBefore" | "stepAfter")}
                  className="h-8 w-32 text-sm border rounded px-2 py-1"
                >
                  <option value="linear">Linear</option>
                  <option value="step">Step</option>
                  <option value="stepBefore">Step Before</option>
                  <option value="stepAfter">Step After</option>
                </select>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <InterlockChart
                name={name}
                xParameter={xParameter}
                xUnit={xUnit}
                yUnit={yUnit}
                thresholds={thresholds}
                lineType={lineType}
                width={550}
                height={400}
              />
            </div>
          </div>

          {/* Right Panel - Form and Settings */}
          <div className="w-1/2 overflow-y-auto space-y-2 pl-2">
            <InterlockFormFields
              name={name}
              onNameChange={setName}
              xParameter={xParameter}
              onXParameterChange={setXParameter}
              xUnit={xUnit}
              onXUnitChange={setXUnit}
              yUnit={yUnit}
              onYUnitChange={setYUnit}
            />

            <ThresholdColorSection
              thresholds={thresholds}
              onUpdateThresholds={setThresholds}
            />

            <ThresholdPointsTable
              thresholds={thresholds}
              onUpdateThresholds={setThresholds}
              xParameter={xParameter}
              xUnit={xUnit}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
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