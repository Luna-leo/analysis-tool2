"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InterlockMaster, InterlockThreshold } from "@/types"
import { InterlockFormFields } from "@/components/charts/EditModal/parameters/InterlockFormFields"
import { PlantMachineFields } from "@/components/charts/EditModal/parameters/PlantMachineFields"
import { ThresholdColorSection } from "@/components/charts/EditModal/parameters/ThresholdColorSection"
import { ThresholdPointsTable } from "@/components/charts/EditModal/parameters/ThresholdPointsTable"
import { InterlockChart } from "@/components/charts/EditModal/parameters/InterlockChart"
import { defaultThresholdColors } from "@/data/interlockMaster"
import { formatDateToISO } from "@/utils/dateUtils"

interface InterlockEditDialogProps {
  item: InterlockMaster
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: InterlockMaster) => void
  mode?: 'add' | 'edit' | 'duplicate'
}

export function InterlockEditDialog({
  item,
  open,
  onOpenChange,
  onSave,
  mode,
}: InterlockEditDialogProps) {
  // Create default interlock data
  const getDefaultInterlock = (): InterlockMaster => ({
    id: '',
    name: '',
    category: 'Safety',
    plant_name: '',
    machine_no: '',
    description: '',
    x_parameter: '',
    y_unit: '',
    threshold_count: 0,
    definition: {
      id: '',
      name: '',
      description: '',
      xParameter: '',
      xUnit: '',
      yUnit: '',
      thresholds: []
    },
    createdAt: formatDateToISO(new Date()),
    updatedAt: formatDateToISO(new Date())
  })
  
  const [formData, setFormData] = useState<InterlockMaster>(() => 
    item.id ? item : getDefaultInterlock()
  )
  const [lineType, setLineType] = useState<"linear" | "step" | "stepBefore" | "stepAfter">("linear")
  const chartContainerRef = React.useRef<HTMLDivElement>(null)
  const [chartSize, setChartSize] = useState({ width: 600, height: 400 })

  useEffect(() => {
    if (open) {
      if (mode === 'add') {
        // For add mode, create new data with sample thresholds
        const newData = getDefaultInterlock()
        newData.definition.thresholds = [
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
        ]
        setFormData(newData)
      } else if (mode === 'duplicate') {
        // For duplicate mode, deep copy the item data
        // Note: name already has (Copy) suffix from useMasterPage
        const duplicatedData = {
          ...item,
          id: '',
          definition: {
            ...item.definition,
            id: '',
            thresholds: item.definition?.thresholds?.map(threshold => ({
              ...threshold,
              id: `${threshold.id}_copy_${Date.now()}`,
              points: [...threshold.points]
            })) || []
          },
          createdAt: formatDateToISO(new Date()),
          updatedAt: formatDateToISO(new Date())
        }
        setFormData(duplicatedData)
      } else {
        // For edit mode, use the item as is
        setFormData(item)
      }
    }
  }, [open, item, mode])

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

  const handleSave = () => {
    onSave({
      ...formData,
      updatedAt: formatDateToISO(new Date())
    })
  }

  const handleChange = (field: keyof InterlockMaster, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDefinitionChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      definition: {
        ...prev.definition,
        [field]: value,
        name: field === "name" ? value : prev.definition.name || value
      }
    }))
  }

  const handleThresholdsChange = (thresholds: InterlockThreshold[]) => {
    setFormData((prev) => ({
      ...prev,
      definition: {
        ...prev.definition,
        thresholds: thresholds,
      }
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[90vw] h-[95vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {mode === 'edit' ? "Edit Interlock" : mode === 'duplicate' ? "Duplicate Interlock" : "New Interlock Registration"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex gap-4">
          {/* Left Panel - Graph */}
          <div className="w-1/2 pr-2 flex flex-col min-h-0">
            <div className="shrink-0 mb-2">
              <PlantMachineFields
                plant={formData.plant_name}
                onPlantChange={(value) => handleChange("plant_name", value)}
                machineNo={formData.machine_no}
                onMachineNoChange={(value) => handleChange("machine_no", value)}
              />
            </div>
            <div ref={chartContainerRef} className="flex-1 min-h-0 bg-gray-50 rounded-lg p-1 flex items-center justify-center">
              <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                <InterlockChart
                  name={formData.name}
                  xParameter={formData.definition.xParameter || ""}
                  xUnit={formData.definition.xUnit || ""}
                  yUnit={formData.definition.yUnit || ""}
                  thresholds={formData.definition.thresholds}
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
                name={formData.name}
                onNameChange={(value) => {
                  handleChange("name", value)
                  handleDefinitionChange("name", value)
                }}
                xParameter={formData.definition.xParameter || ""}
                onXParameterChange={(value) => handleDefinitionChange("xParameter", value)}
                xUnit={formData.definition.xUnit || ""}
                onXUnitChange={(value) => handleDefinitionChange("xUnit", value)}
                yUnit={formData.definition.yUnit || ""}
                onYUnitChange={(value) => handleDefinitionChange("yUnit", value)}
              />
              <div className="mt-2">
                <ThresholdColorSection
                  thresholds={formData.definition.thresholds}
                  onUpdateThresholds={handleThresholdsChange}
                />
              </div>
            </div>

            <div className="mt-2 flex-1 min-h-0">
              <ThresholdPointsTable
                thresholds={formData.definition.thresholds}
                onUpdateThresholds={handleThresholdsChange}
                xParameter={formData.definition.xParameter}
                xUnit={formData.definition.xUnit}
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
          <Button onClick={handleSave} disabled={!formData.name.trim() || !formData.plant_name.trim() || !formData.machine_no.trim()}>
            {mode === 'edit' ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}