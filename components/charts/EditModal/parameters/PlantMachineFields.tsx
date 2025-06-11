"use client"

import React, { useEffect, memo } from "react"
import { InputCombobox } from "@/components/ui/input-combobox"
import { Label } from "@/components/ui/label"
import { useInputHistoryStore } from "@/stores/useInputHistoryStore"

/**
 * Props for PlantMachineFields component
 */
interface PlantMachineFieldsProps {
  /** Current plant value */
  plant: string
  /** Callback when plant value changes */
  onPlantChange: (plant: string) => void
  /** Current machine number value */
  machineNo: string
  /** Callback when machine number changes */
  onMachineNoChange: (machineNo: string) => void
  /** Whether the fields are disabled */
  disabled?: boolean
  /** Flag to indicate when to save to history (typically on successful save/import) */
  onSave?: boolean
}

/**
 * Reusable component for Plant and Machine No input fields
 * Features input history with suggestions from previous entries
 */
export const PlantMachineFields = memo(function PlantMachineFields({
  plant,
  onPlantChange,
  machineNo,
  onMachineNoChange,
  disabled = false,
  onSave = false
}: PlantMachineFieldsProps) {
  const { 
    getPlantSuggestions, 
    getMachineSuggestions,
    addPlantHistory,
    addMachineHistory
  } = useInputHistoryStore()

  // Save to history when onSave flag is true
  useEffect(() => {
    if (onSave) {
      if (plant.trim()) {
        addPlantHistory(plant)
      }
      if (machineNo.trim()) {
        addMachineHistory(machineNo)
      }
    }
  }, [onSave, plant, machineNo, addPlantHistory, addMachineHistory])

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <Label htmlFor="plant" className="text-sm">Plant</Label>
        <InputCombobox
          value={plant}
          onChange={onPlantChange}
          suggestions={getPlantSuggestions()}
          placeholder="Plant A"
          disabled={disabled}
          inputClassName="h-8"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="machine-no" className="text-sm">Machine</Label>
        <InputCombobox
          value={machineNo}
          onChange={onMachineNoChange}
          suggestions={getMachineSuggestions()}
          placeholder="M-001"
          disabled={disabled}
          inputClassName="h-8"
        />
      </div>
    </div>
  )
})