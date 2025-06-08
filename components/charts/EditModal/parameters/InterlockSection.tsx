"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Settings, Edit2 } from "lucide-react"
import { InterlockRegistrationDialog } from "./InterlockRegistrationDialog"
import { ChartComponent, InterlockDefinition, InterlockThreshold } from "@/types"
import { mockInterlockMaster, defaultThresholdColors } from "@/data/interlockMaster"

interface InterlockSectionProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function InterlockSection({ editingChart, setEditingChart }: InterlockSectionProps) {
  const [showInterlockEditor, setShowInterlockEditor] = useState<string | null>(null)
  const [editingThresholdName, setEditingThresholdName] = useState<string | null>(null)
  const [showInterlockDialog, setShowInterlockDialog] = useState(false)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  
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
      selectedThresholds: [] as string[],
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

  const handleInterlockSave = (
    definition: InterlockDefinition,
    selectedThresholds: string[],
    _plant: string,
    _machineNo: string
  ) => {
    if (editingLineId) {
      const finalThresholds =
        selectedThresholds.length > 0
          ? selectedThresholds
          : definition.thresholds.map(t => t.id)
      handleUpdateInterlockLine(editingLineId, {
        interlockDefinition: definition,
        interlockSource: "custom",
        selectedThresholds: finalThresholds,
      })
    }
    setEditingLineId(null)
  }

  const handleThresholdToggle = (lineId: string, thresholdId: string) => {
    const line = interlockLines.find(l => l.id === lineId)
    if (!line) return

    const currentThresholds = line.selectedThresholds || []
    const newThresholds = currentThresholds.includes(thresholdId)
      ? currentThresholds.filter(id => id !== thresholdId)
      : [...currentThresholds, thresholdId]

    handleUpdateInterlockLine(lineId, { selectedThresholds: newThresholds })
  }

  const getNextColor = (existingThresholds: InterlockThreshold[]) => {
    const usedColors = existingThresholds.map(t => t.color)
    return defaultThresholdColors.find(color => !usedColors.includes(color)) || defaultThresholdColors[0]
  }

  const renderInterlockTableEditor = (lineId: string) => {
    const line = interlockLines.find(l => l.id === lineId)
    if (!line || !line.interlockDefinition) return null

    const thresholds = line.interlockDefinition.thresholds
    
    // Get unique X values from all thresholds
    const xValues = new Set<number>()
    thresholds.forEach(threshold => {
      threshold.points.forEach(point => xValues.add(point.x))
    })
    const sortedXValues = Array.from(xValues).sort((a, b) => a - b)

    // Create a map of x -> threshold id -> y value
    const valueMap = new Map<number, Map<string, number>>()
    sortedXValues.forEach(x => {
      valueMap.set(x, new Map())
    })

    thresholds.forEach(threshold => {
      threshold.points.forEach(point => {
        const xMap = valueMap.get(point.x)
        if (xMap) {
          xMap.set(threshold.id, point.y)
        }
      })
    })

    const handleCellChange = (x: number, thresholdId: string, value: number) => {
      const newThresholds = thresholds.map(threshold => {
        if (threshold.id === thresholdId) {
          const newPoints = threshold.points.map(point =>
            point.x === x ? { ...point, y: value } : point
          )
          // If this x value doesn't exist in this threshold, add it
          if (!newPoints.find(p => p.x === x)) {
            newPoints.push({ x, y: value })
            newPoints.sort((a, b) => a.x - b.x)
          }
          return { ...threshold, points: newPoints }
        }
        return threshold
      })

      handleUpdateInterlockLine(lineId, {
        interlockDefinition: {
          ...line.interlockDefinition!,
          thresholds: newThresholds
        }
      })
    }

    const handleXChange = (oldX: number, newX: number) => {
      const newThresholds = thresholds.map(threshold => {
        const newPoints = threshold.points.map(point =>
          point.x === oldX ? { ...point, x: newX } : point
        )
        return { ...threshold, points: newPoints }
      })

      handleUpdateInterlockLine(lineId, {
        interlockDefinition: {
          ...line.interlockDefinition!,
          thresholds: newThresholds
        }
      })
    }

    const handleAddRow = () => {
      const maxX = Math.max(...sortedXValues, 0)
      const newX = maxX + 10

      const newThresholds = thresholds.map(threshold => {
        const lastPoint = threshold.points[threshold.points.length - 1]
        const newY = lastPoint ? lastPoint.y : 0
        return {
          ...threshold,
          points: [...threshold.points, { x: newX, y: newY }].sort((a, b) => a.x - b.x)
        }
      })

      handleUpdateInterlockLine(lineId, {
        interlockDefinition: {
          ...line.interlockDefinition!,
          thresholds: newThresholds
        }
      })
    }

    const handleRemoveRow = (x: number) => {
      const newThresholds = thresholds.map(threshold => ({
        ...threshold,
        points: threshold.points.filter(point => point.x !== x)
      }))

      handleUpdateInterlockLine(lineId, {
        interlockDefinition: {
          ...line.interlockDefinition!,
          thresholds: newThresholds
        }
      })
    }

    const handleAddThreshold = () => {
      const newThreshold: InterlockThreshold = {
        id: `threshold_${Date.now()}`,
        name: "New Threshold",
        color: getNextColor(thresholds),
        points: sortedXValues.map(x => ({ x, y: 0 }))
      }

      const newThresholds = [...thresholds, newThreshold]

      handleUpdateInterlockLine(lineId, {
        interlockDefinition: {
          ...line.interlockDefinition!,
          thresholds: newThresholds
        }
      })
    }

    const handleRemoveThreshold = (thresholdId: string) => {
      const newThresholds = thresholds.filter(threshold => threshold.id !== thresholdId)

      // Also remove from selected thresholds
      const newSelectedThresholds = line.selectedThresholds?.filter(
        id => id !== thresholdId
      ) || []

      handleUpdateInterlockLine(lineId, {
        interlockDefinition: {
          ...line.interlockDefinition!,
          thresholds: newThresholds
        },
        selectedThresholds: newSelectedThresholds
      })
    }


    const handleUpdateThresholdColor = (thresholdId: string, newColor: string) => {
      const newThresholds = thresholds.map(threshold =>
        threshold.id === thresholdId ? { ...threshold, color: newColor } : threshold
      )

      handleUpdateInterlockLine(lineId, {
        interlockDefinition: {
          ...line.interlockDefinition!,
          thresholds: newThresholds
        }
      })
    }

    return (
      <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">Edit Interlock Points</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRow}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddThreshold}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Threshold
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInterlockEditor(null)}
            >
              Close
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="w-16 px-2 py-1 text-xs">X</TableHead>
                {thresholds.map(threshold => (
                  <TableHead key={threshold.id} className="w-24 px-2 py-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Input
                          type="color"
                          value={threshold.color}
                          onChange={(e) => handleUpdateThresholdColor(threshold.id, e.target.value)}
                          className="w-4 h-4 p-0 border-none cursor-pointer flex-shrink-0"
                        />
                        {editingThresholdName === threshold.id ? (
                          <Input
                            value={threshold.name}
                            onChange={(e) => {
                              const newThresholds = thresholds.map(t =>
                                t.id === threshold.id ? { ...t, name: e.target.value } : t
                              )
                              handleUpdateInterlockLine(lineId, {
                                interlockDefinition: {
                                  ...line.interlockDefinition!,
                                  thresholds: newThresholds
                                }
                              })
                            }}
                            onBlur={() => setEditingThresholdName(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Escape') {
                                setEditingThresholdName(null)
                              }
                            }}
                            className="h-6 text-xs px-1 flex-1 min-w-0"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => setEditingThresholdName(threshold.id)}
                            className="text-xs truncate text-left flex-1 min-w-0 hover:bg-muted px-1 py-1 rounded"
                          >
                            {threshold.name}
                          </button>
                        )}
                      </div>
                      {thresholds.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveThreshold(threshold.id)}
                          className="h-4 w-4 p-0 opacity-50 hover:opacity-100 flex-shrink-0"
                        >
                          <Trash2 className="h-2 w-2" />
                        </Button>
                      )}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-8 px-1"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedXValues.map((x, idx) => (
                <TableRow key={idx} className="h-8">
                  <TableCell className="px-2 py-1">
                    <Input
                      type="number"
                      value={x}
                      onChange={(e) => handleXChange(x, parseFloat(e.target.value) || 0)}
                      className="h-6 w-16 text-xs px-1"
                    />
                  </TableCell>
                  {thresholds.map(threshold => (
                    <TableCell key={threshold.id} className="px-2 py-1">
                      <Input
                        type="number"
                        value={valueMap.get(x)?.get(threshold.id) || 0}
                        onChange={(e) => handleCellChange(x, threshold.id, parseFloat(e.target.value) || 0)}
                        className="h-6 w-20 text-xs px-1"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="px-1 py-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRow(x)}
                      className="h-6 w-6 p-0"
                      disabled={sortedXValues.length <= 1}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <>
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
                  <div className="flex gap-2">
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
                      <SelectTrigger id={`interlock-${line.id}`} className="flex-1">
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
                    {line.interlockId && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingLineId(line.id)
                          setShowInterlockDialog(true)
                        }}
                        className="h-10 w-10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
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
                                id: "caution",
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
                                id: "alarm",
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
                      <div key={threshold.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${line.id}-${threshold.id}`}
                          checked={line.selectedThresholds?.includes(threshold.id) || false}
                          onCheckedChange={() => handleThresholdToggle(line.id, threshold.id)}
                        />
                        <Label
                          htmlFor={`${line.id}-${threshold.id}`}
                          className="text-sm font-normal flex items-center gap-2 cursor-pointer"
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: threshold.color }}
                          />
                          {threshold.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showInterlockEditor === line.id && renderInterlockTableEditor(line.id)}
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
    <InterlockRegistrationDialog
      open={showInterlockDialog}
      onOpenChange={(open) => {
        setShowInterlockDialog(open)
        if (!open) {
          setEditingLineId(null)
        }
      }}
      onSave={handleInterlockSave}
      mode="edit"
      initialDefinition={
        editingLineId
          ? editingChart.referenceLines?.find(l => l.id === editingLineId)?.interlockDefinition
          : undefined
      }
      initialSelectedThresholds={
        editingLineId
          ? editingChart.referenceLines?.find(l => l.id === editingLineId)?.selectedThresholds
          : undefined
      }
    />
    </>
  )
}