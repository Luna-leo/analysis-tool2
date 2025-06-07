"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

  const renderInterlockTableEditor = (lineId: string) => {
    const line = interlockLines.find(l => l.id === lineId)
    if (!line || !line.interlockDefinition) return null

    const availableThresholdTypes: InterlockThresholdType[] = ["caution", "pre-alarm", "alarm", "trip"]
    const thresholdTypes = line.interlockDefinition.thresholds.map(t => t.type)
    
    // Get unique X values from all thresholds
    const xValues = new Set<number>()
    line.interlockDefinition.thresholds.forEach(threshold => {
      threshold.points.forEach(point => xValues.add(point.x))
    })
    const sortedXValues = Array.from(xValues).sort((a, b) => a - b)

    // Create a map of x -> threshold type -> y value
    const valueMap = new Map<number, Map<InterlockThresholdType, number>>()
    sortedXValues.forEach(x => {
      valueMap.set(x, new Map())
    })

    line.interlockDefinition.thresholds.forEach(threshold => {
      threshold.points.forEach(point => {
        const xMap = valueMap.get(point.x)
        if (xMap) {
          xMap.set(threshold.type, point.y)
        }
      })
    })

    const handleCellChange = (x: number, thresholdType: InterlockThresholdType, value: number) => {
      const newThresholds = line.interlockDefinition!.thresholds.map(threshold => {
        if (threshold.type === thresholdType) {
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
      const newThresholds = line.interlockDefinition!.thresholds.map(threshold => {
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

      const newThresholds = line.interlockDefinition!.thresholds.map(threshold => {
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
      const newThresholds = line.interlockDefinition!.thresholds.map(threshold => ({
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

    const handleAddColumn = (thresholdType: InterlockThresholdType) => {
      // Create new threshold with default values for existing X points
      const newThreshold = {
        type: thresholdType,
        points: sortedXValues.map(x => ({ x, y: 0 }))
      }

      const newThresholds = [...line.interlockDefinition!.thresholds, newThreshold]

      handleUpdateInterlockLine(lineId, {
        interlockDefinition: {
          ...line.interlockDefinition!,
          thresholds: newThresholds
        }
      })
    }

    const handleRemoveColumn = (thresholdType: InterlockThresholdType) => {
      const newThresholds = line.interlockDefinition!.thresholds.filter(
        threshold => threshold.type !== thresholdType
      )

      // Also remove from selected thresholds
      const newSelectedThresholds = line.selectedThresholds?.filter(
        type => type !== thresholdType
      ) || []

      handleUpdateInterlockLine(lineId, {
        interlockDefinition: {
          ...line.interlockDefinition!,
          thresholds: newThresholds
        },
        selectedThresholds: newSelectedThresholds
      })
    }

    const getAvailableThresholdTypes = () => {
      return availableThresholdTypes.filter(
        type => !thresholdTypes.includes(type)
      )
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
            {getAvailableThresholdTypes().length > 0 && (
              <Select onValueChange={(value) => handleAddColumn(value as InterlockThresholdType)}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Add Column" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableThresholdTypes().map(type => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: interlockThresholdColors[type] }}
                        />
                        {type}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                {thresholdTypes.map(type => (
                  <TableHead key={type} className="w-20 px-2 py-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: interlockThresholdColors[type] }}
                        />
                        <span className="text-xs truncate">{type}</span>
                      </div>
                      {thresholdTypes.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveColumn(type)}
                          className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
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
                  {thresholdTypes.map(type => (
                    <TableCell key={type} className="px-2 py-1">
                      <Input
                        type="number"
                        value={valueMap.get(x)?.get(type) || 0}
                        onChange={(e) => handleCellChange(x, type, parseFloat(e.target.value) || 0)}
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
                                type: "pre-alarm",
                                points: [
                                  { x: 0, y: 100 },
                                  { x: 10, y: 100 },
                                  { x: 20, y: 100 },
                                  { x: 30, y: 100 },
                                  { x: 40, y: 100 },
                                  { x: 50, y: 100 }
                                ]
                              },
                              {
                                type: "alarm",
                                points: [
                                  { x: 0, y: 5 },
                                  { x: 10, y: 7 },
                                  { x: 20, y: 7 },
                                  { x: 30, y: 80 },
                                  { x: 40, y: 80 },
                                  { x: 50, y: 90 }
                                ]
                              },
                              {
                                type: "trip",
                                points: [
                                  { x: 0, y: 120 },
                                  { x: 10, y: 120 },
                                  { x: 20, y: 120 },
                                  { x: 30, y: 120 },
                                  { x: 40, y: 120 },
                                  { x: 50, y: 120 }
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
  )
}