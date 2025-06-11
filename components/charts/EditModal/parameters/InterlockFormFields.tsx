"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ParameterCombobox } from "@/components/search"
import { EventInfo } from "@/types"
import { parseParameterKey } from "@/utils/parameterUtils"

interface InterlockFormFieldsProps {
  name: string
  onNameChange: (name: string) => void
  xParameter: string
  onXParameterChange: (xParameter: string) => void
  xUnit: string
  onXUnitChange: (xUnit: string) => void
  yUnit: string
  onYUnitChange: (yUnit: string) => void
  selectedDataSourceItems?: EventInfo[]
}

export function InterlockFormFields({
  name,
  onNameChange,
  xParameter,
  onXParameterChange,
  xUnit,
  onXUnitChange,
  yUnit,
  onYUnitChange,
  selectedDataSourceItems
}: InterlockFormFieldsProps) {
  const handleParameterSelect = (paramKey: string) => {
    const parsed = parseParameterKey(paramKey)
    if (parsed) {
      onXParameterChange(paramKey)
      onXUnitChange(parsed.unit) // Automatically set X Unit
    }
  }
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
          <ParameterCombobox
            value={xParameter}
            onChange={handleParameterSelect}
            selectedDataSourceItems={selectedDataSourceItems}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="x-unit" className="text-sm">X Unit</Label>
          <Input
            id="x-unit"
            value={xUnit}
            readOnly
            className="h-8 bg-muted"
          />
        </div>
      </div>

    </div>
  )
}