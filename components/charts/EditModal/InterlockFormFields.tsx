"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface InterlockFormFieldsProps {
  name: string
  onNameChange: (name: string) => void
  plant: string
  onPlantChange: (plant: string) => void
  machineNo: string
  onMachineNoChange: (machineNo: string) => void
  xParameter: string
  onXParameterChange: (xParameter: string) => void
  xUnit: string
  onXUnitChange: (xUnit: string) => void
  yUnit: string
  onYUnitChange: (yUnit: string) => void
}

export function InterlockFormFields({
  name,
  onNameChange,
  plant,
  onPlantChange,
  machineNo,
  onMachineNoChange,
  xParameter,
  onXParameterChange,
  xUnit,
  onXUnitChange,
  yUnit,
  onYUnitChange
}: InterlockFormFieldsProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="interlock-name" className="text-sm">Name</Label>
          <Input
            id="interlock-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Interlock name"
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="y-unit" className="text-sm">Y Unit</Label>
          <Input
            id="y-unit"
            value={yUnit}
            onChange={(e) => onYUnitChange(e.target.value)}
            placeholder="MPa"
            className="h-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="x-parameter" className="text-sm">X Parameter</Label>
          <Input
            id="x-parameter"
            value={xParameter}
            onChange={(e) => onXParameterChange(e.target.value)}
            placeholder="Temperature"
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="x-unit" className="text-sm">X Unit</Label>
          <Input
            id="x-unit"
            value={xUnit}
            onChange={(e) => onXUnitChange(e.target.value)}
            placeholder="°C"
            className="h-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="plant" className="text-sm">Plant</Label>
          <Input
            id="plant"
            value={plant}
            onChange={(e) => onPlantChange(e.target.value)}
            placeholder="Plant A"
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="machine-no" className="text-sm">Machine No</Label>
          <Input
            id="machine-no"
            value={machineNo}
            onChange={(e) => onMachineNoChange(e.target.value)}
            placeholder="M-001"
            className="h-8"
          />
        </div>
      </div>
    </div>
  )
}