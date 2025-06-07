"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Trash2, Plus, Settings } from "lucide-react"
import { ChartComponent, InterlockThresholdType, InterlockDefinition, InterlockPoint } from "@/types"
import { mockInterlockMaster, interlockThresholdColors } from "@/data/interlockMaster"

interface InterlockSectionProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function InterlockSection({ editingChart, setEditingChart }: InterlockSectionProps) {
  const [showInterlockEditor, setShowInterlockEditor] = useState<string | null>(null)
  
  const interlockLines = editingChart.referenceLines?.filter(line => line.type === "interlock") || []

  const handleAddInterlockLine = () => {
    const newInterlockLine = {
      id: Date.now().toString(),
      type: "interlock" as const,
      value: 0,
      label: "New Interlock",
      color: "#ff0000",
      style: "solid" as const,
      interlockSource: "master" as const,
      selectedThresholds: ["alarm"] as InterlockThresholdType[],
    }
    
    setEditingChart({
      ...editingChart,
      referenceLines: [...(editingChart.referenceLines || []), newInterlockLine],
    })
  }

  const handleUpdateInterlockLine = (id: string, updates: any) => {
    setEditingChart({
      ...editingChart,
      referenceLines: editingChart.referenceLines?.map((line) =>
        line.id === id ? { ...line, ...updates } : line
      ),
    })
  }

  const handleRemoveInterlockLine = (id: string) => {
    setEditingChart({
      ...editingChart,
      referenceLines: editingChart.referenceLines?.filter((line) => line.id !== id),
    })
  }

  const handleThresholdToggle = (lineId: string, threshold: InterlockThresholdType) => {
    const line = interlockLines.find(l => l.id === lineId)
    if (!line) return

    const currentThresholds = line.selectedThresholds || []
    const newThresholds = currentThresholds.includes(threshold)
      ? currentThresholds.filter(t => t !== threshold)
      : [...currentThresholds, threshold]

    handleUpdateInterlockLine(lineId, { selectedThresholds: newThresholds })
  }

  const renderInterlockEditor = (lineId: string) => {
    const line = interlockLines.find(l => l.id === lineId)
    if (!line || !line.interlockDefinition) return null

    return (
      <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">Edit Interlock Points</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInterlockEditor(null)}
          >
            Close
          </Button>
        </div>
        
        {line.interlockDefinition.thresholds.map((threshold) => (
          <div key={threshold.type} className="space-y-2">
            <Label className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: interlockThresholdColors[threshold.type] }}
              />
              {threshold.type.charAt(0).toUpperCase() + threshold.type.slice(1)}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {threshold.points.map((point, idx) => (
                <div key={idx} className="flex gap-2 items-center text-sm">
                  <Input
                    type="number"
                    value={point.x}
                    onChange={(e) => {
                      const newPoints = [...threshold.points]
                      newPoints[idx] = { ...point, x: parseFloat(e.target.value) || 0 }
                      const newThresholds = line.interlockDefinition!.thresholds.map(t =>
                        t.type === threshold.type ? { ...t, points: newPoints } : t
                      )
                      handleUpdateInterlockLine(lineId, {
                        interlockDefinition: {
                          ...line.interlockDefinition!,
                          thresholds: newThresholds
                        }
                      })
                    }}
                    className="h-7"
                    placeholder="X"
                  />
                  <span>:</span>
                  <Input
                    type="number"
                    value={point.y}
                    onChange={(e) => {
                      const newPoints = [...threshold.points]
                      newPoints[idx] = { ...point, y: parseFloat(e.target.value) || 0 }
                      const newThresholds = line.interlockDefinition!.thresholds.map(t =>
                        t.type === threshold.type ? { ...t, points: newPoints } : t
                      )
                      handleUpdateInterlockLine(lineId, {
                        interlockDefinition: {
                          ...line.interlockDefinition!,
                          thresholds: newThresholds
                        }
                      })
                    }}
                    className="h-7"
                    placeholder="Y"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium">Interlock Thresholds</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Define interlock value thresholds using predefined masters or custom definitions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddInterlockLine}
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-3">
        {interlockLines.map((line) => (
          <div key={line.id} className="border rounded-lg p-3 space-y-3">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`label-${line.id}`}>Label</Label>
                  <Input
                    id={`label-${line.id}`}
                    value={line.label}
                    onChange={(e) => handleUpdateInterlockLine(line.id, { label: e.target.value })}
                    placeholder="Interlock label"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <RadioGroup
                    value={line.interlockSource || "master"}
                    onValueChange={(value) => handleUpdateInterlockLine(line.id, { interlockSource: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="master" id={`master-${line.id}`} />
                      <Label htmlFor={`master-${line.id}`} className="text-sm font-normal">
                        Master
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id={`custom-${line.id}`} />
                      <Label htmlFor={`custom-${line.id}`} className="text-sm font-normal">
                        Custom
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {line.interlockSource === "master" ? (
                <div className="space-y-2">
                  <Label htmlFor={`interlock-${line.id}`}>Select Interlock Master</Label>
                  <Select
                    value={line.interlockId}
                    onValueChange={(value) => {
                      const selectedMaster = mockInterlockMaster.find(m => m.id === value)
                      if (selectedMaster) {
                        handleUpdateInterlockLine(line.id, {
                          interlockId: value,
                          interlockDefinition: selectedMaster.definition,
                          label: selectedMaster.name
                        })
                      }
                    }}
                  >
                    <SelectTrigger id={`interlock-${line.id}`}>
                      <SelectValue placeholder="Select an interlock" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockInterlockMaster.map((master) => (
                        <SelectItem key={master.id} value={master.id}>
                          {master.name} ({master.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Custom Interlock Definition</Label>
                    {!line.interlockDefinition ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newDefinition: InterlockDefinition = {
                            id: `custom-${line.id}`,
                            name: line.label,
                            thresholds: [
                              {
                                type: "caution",
                                points: Array(5).fill(0).map((_, i) => ({ x: i * 50, y: i * 10 }))
                              },
                              {
                                type: "alarm",
                                points: Array(5).fill(0).map((_, i) => ({ x: i * 50, y: i * 15 }))
                              },
                              {
                                type: "trip",
                                points: Array(5).fill(0).map((_, i) => ({ x: i * 50, y: i * 20 }))
                              }
                            ]
                          }
                          handleUpdateInterlockLine(line.id, { interlockDefinition: newDefinition })
                        }}
                      >
                        Create Definition
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowInterlockEditor(showInterlockEditor === line.id ? null : line.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {line.interlockDefinition && (
                <div className="space-y-2">
                  <Label>Select Thresholds to Display</Label>
                  <div className="space-y-2">
                    {line.interlockDefinition.thresholds.map((threshold) => (
                      <div key={threshold.type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${line.id}-${threshold.type}`}
                          checked={line.selectedThresholds?.includes(threshold.type) || false}
                          onCheckedChange={() => handleThresholdToggle(line.id, threshold.type)}
                        />
                        <Label
                          htmlFor={`${line.id}-${threshold.type}`}
                          className="text-sm font-normal flex items-center gap-2 cursor-pointer"
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: interlockThresholdColors[threshold.type] }}
                          />
                          {threshold.type.charAt(0).toUpperCase() + threshold.type.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showInterlockEditor === line.id && renderInterlockEditor(line.id)}
            </div>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveInterlockLine(line.id)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {interlockLines.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="text-sm">No interlock thresholds added yet.</p>
          <p className="text-sm">Click "Add" to create an interlock threshold.</p>
        </div>
      )}
    </div>
  )
}