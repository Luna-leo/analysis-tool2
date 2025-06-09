"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PlantMachineFieldsProps {
  plant: string
  onPlantChange: (plant: string) => void
  machineNo: string
  onMachineNoChange: (machineNo: string) => void
}

export function PlantMachineFields({
  plant,
  onPlantChange,
  machineNo,
  onMachineNoChange
}: PlantMachineFieldsProps) {
  return (
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
        <Label htmlFor="machine-no" className="text-sm">Machine</Label>
        <Input
          id="machine-no"
          value={machineNo}
          onChange={(e) => onMachineNoChange(e.target.value)}
          placeholder="M-001"
          className="h-8"
        />
      </div>
    </div>
  )
}