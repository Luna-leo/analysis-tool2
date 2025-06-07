"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus } from "lucide-react"
import { InterlockDefinition, InterlockThreshold } from "@/types"
import { defaultThresholdColors } from "@/data/interlockMaster"

interface InterlockRegistrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (interlockDefinition: InterlockDefinition, selectedThresholds: string[]) => void
  initialDefinition?: InterlockDefinition
  initialSelectedThresholds?: string[]
}

export function InterlockRegistrationDialog({
  open,
  onOpenChange,
  onSave,
  initialDefinition,
  initialSelectedThresholds
}: InterlockRegistrationDialogProps) {
  const [name, setName] = useState(initialDefinition?.name || "")
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
  const [editingThresholdName, setEditingThresholdName] = useState<string | null>(null)

  // Reset state when dialog opens with new initial values
  useEffect(() => {
    if (open) {
      setName(initialDefinition?.name || "")
      setXParameter(initialDefinition?.xParameter || "")
      setXUnit(initialDefinition?.xUnit || "")
      setYUnit(initialDefinition?.yUnit || "")
      setSelectedThresholds(initialSelectedThresholds || [])
      setThresholds(initialDefinition?.thresholds || [
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
      ])
    }
  }, [open, initialDefinition, initialSelectedThresholds])

  const getNextColor = (existingThresholds: InterlockThreshold[]) => {
    const usedColors = existingThresholds.map(t => t.color)
    return defaultThresholdColors.find(color => !usedColors.includes(color)) || defaultThresholdColors[0]
  }

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
    setThresholds(thresholds.map(threshold => {
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
    }))
  }

  const handleXChange = (oldX: number, newX: number) => {
    setThresholds(thresholds.map(threshold => {
      const newPoints = threshold.points.map(point =>
        point.x === oldX ? { ...point, x: newX } : point
      )
      return { ...threshold, points: newPoints }
    }))
  }

  const handleAddRow = () => {
    const maxX = Math.max(...sortedXValues, 0)
    const newX = maxX + 10

    setThresholds(thresholds.map(threshold => {
      const lastPoint = threshold.points[threshold.points.length - 1]
      const newY = lastPoint ? lastPoint.y : 0
      return {
        ...threshold,
        points: [...threshold.points, { x: newX, y: newY }].sort((a, b) => a.x - b.x)
      }
    }))
  }

  const handleRemoveRow = (x: number) => {
    setThresholds(thresholds.map(threshold => ({
      ...threshold,
      points: threshold.points.filter(point => point.x !== x)
    })))
  }

  const handleAddThreshold = () => {
    const newThreshold: InterlockThreshold = {
      id: `threshold_${Date.now()}`,
      name: "New Threshold",
      color: getNextColor(thresholds),
      points: sortedXValues.map(x => ({ x, y: 0 }))
    }
    setThresholds([...thresholds, newThreshold])
  }

  const handleRemoveThreshold = (thresholdId: string) => {
    setThresholds(thresholds.filter(threshold => threshold.id !== thresholdId))
  }

  const handleUpdateThresholdColor = (thresholdId: string, newColor: string) => {
    setThresholds(thresholds.map(threshold =>
      threshold.id === thresholdId ? { ...threshold, color: newColor } : threshold
    ))
  }

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
    onSave(interlockDefinition, selectedThresholds)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {initialDefinition ? "Edit Interlock Definition" : "New Interlock Registration"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interlock-name">Name</Label>
              <Input
                id="interlock-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Interlock name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="y-unit">Y Unit</Label>
              <Input
                id="y-unit"
                value={yUnit}
                onChange={(e) => setYUnit(e.target.value)}
                placeholder="e.g., MPa"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="x-parameter">X Parameter</Label>
              <Input
                id="x-parameter"
                value={xParameter}
                onChange={(e) => setXParameter(e.target.value)}
                placeholder="e.g., Temperature"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="x-unit">X Unit</Label>
              <Input
                id="x-unit"
                value={xUnit}
                onChange={(e) => setXUnit(e.target.value)}
                placeholder="e.g., °C"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Select Thresholds to Display</h4>
              <div className="grid grid-cols-2 gap-3">
                {thresholds.map((threshold) => (
                  <div key={threshold.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`threshold-${threshold.id}`}
                      checked={selectedThresholds.includes(threshold.id)}
                      onCheckedChange={() => handleThresholdToggle(threshold.id)}
                    />
                    <Label
                      htmlFor={`threshold-${threshold.id}`}
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

            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Threshold Points</h4>
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
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="text-sm table-auto">
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="px-2 py-1 text-xs text-left">X</TableHead>
                    {thresholds.map(threshold => (
                      <TableHead key={threshold.id} className="px-2 py-1 text-left">
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
                                  setThresholds(thresholds.map(t =>
                                    t.id === threshold.id ? { ...t, name: e.target.value } : t
                                  ))
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
                    <TableHead className="px-1"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedXValues.map((x, idx) => (
                    <TableRow key={idx} className="h-8">
                      <TableCell className="px-2 py-1 text-left">
                        <span className="text-xs font-mono">{idx + 1}</span>
                      </TableCell>
                      {thresholds.map(threshold => (
                        <TableCell key={threshold.id} className="px-2 py-1 text-left">
                          <Input
                            type="number"
                            value={valueMap.get(x)?.get(threshold.id) || 0}
                            onChange={(e) => handleCellChange(x, threshold.id, parseFloat(e.target.value) || 0)}
                            className="h-6 text-xs px-1"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="px-1 py-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRow(x)}
                          className="h-6 p-0"
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
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {initialDefinition ? "Update" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}