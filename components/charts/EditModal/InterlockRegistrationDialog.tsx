"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import * as d3 from "d3"
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
  const [draggedThresholdId, setDraggedThresholdId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [lineType, setLineType] = useState<"linear" | "step" | "stepBefore" | "stepAfter">("linear")
  const svgRef = useRef<SVGSVGElement>(null)

  // Reset state when dialog opens with new initial values
  useEffect(() => {
    if (open) {
      setName(initialDefinition?.name || "")
      setXParameter(initialDefinition?.xParameter || "")
      setXUnit(initialDefinition?.xUnit || "")
      setYUnit(initialDefinition?.yUnit || "")
      setSelectedThresholds(initialSelectedThresholds || [])
      setDraggedThresholdId(null)
      setDragOverIndex(null)
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

  const drawChart = useCallback(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 65, right: 20, bottom: 80, left: 40 }
    const width = 400 - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    // Get all X and Y values for scaling
    const allXValues = new Set<number>()
    const allYValues = new Set<number>()
    
    thresholds.forEach(threshold => {
      threshold.points.forEach(point => {
        allXValues.add(point.x)
        allYValues.add(point.y)
      })
    })

    // Set appropriate domain based on actual data
    let xExtent: [number, number] = [0, 10]
    let yExtent: [number, number] = [0, 10]
    
    if (allXValues.size > 0 && allYValues.size > 0) {
      const xValues = Array.from(allXValues)
      const yValues = Array.from(allYValues)
      
      xExtent = d3.extent(xValues) as [number, number]
      yExtent = d3.extent(yValues) as [number, number]
      
      // Ensure minimum range for better visualization
      const minXRange = 10
      const minYRange = 5
      
      if ((xExtent[1] - xExtent[0]) < minXRange) {
        const center = (xExtent[0] + xExtent[1]) / 2
        xExtent = [center - minXRange / 2, center + minXRange / 2]
      }
      
      if ((yExtent[1] - yExtent[0]) < minYRange) {
        const center = (yExtent[0] + yExtent[1]) / 2
        yExtent = [center - minYRange / 2, center + minYRange / 2]
      }
    }

    // Add minimal padding to the extents (5% instead of 10%)
    const xRange = xExtent[1] - xExtent[0]
    const yRange = yExtent[1] - yExtent[0]
    const xPadding = Math.max(xRange * 0.05, 1)
    const yPadding = Math.max(yRange * 0.05, 0.5)

    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
      .range([0, width])

    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([height, 0])

    // Create main group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))

    g.append("g")
      .call(d3.axisLeft(yScale))

    // Add title (left-aligned)
    g.append("text")
      .attr("transform", `translate(0, -35)`)
      .style("text-anchor", "start")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(name || "Interlock Graph")

    // Add axis labels
    g.append("text")
      .attr("transform", `translate(${width / 2}, ${height + 35})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text(xParameter ? `${xParameter} (${xUnit || ''})` : 'X')

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text(yUnit ? `Y (${yUnit})` : 'Y')

    // Draw threshold lines with selected curve type
    const getCurveType = () => {
      switch (lineType) {
        case "step":
          return d3.curveStep
        case "stepBefore":
          return d3.curveStepBefore
        case "stepAfter":
          return d3.curveStepAfter
        case "linear":
        default:
          return d3.curveLinear
      }
    }

    const line = d3.line<{x: number, y: number}>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(getCurveType())

    // Always show all thresholds in the graph
    thresholds.forEach(threshold => {
      // Sort points by x value for proper line drawing
      const sortedPoints = [...threshold.points].sort((a, b) => a.x - b.x)
      
      if (sortedPoints.length > 0) {
        g.append("path")
          .datum(sortedPoints)
          .attr("fill", "none")
          .attr("stroke", threshold.color)
          .attr("stroke-width", 2)
          .attr("d", line)

        // Add points
        g.selectAll(`.point-${threshold.id}`)
          .data(sortedPoints)
          .enter().append("circle")
          .attr("class", `point-${threshold.id}`)
          .attr("cx", d => xScale(d.x))
          .attr("cy", d => yScale(d.y))
          .attr("r", 3)
          .attr("fill", threshold.color)
      }
    })

    // Add legend horizontally at the bottom with wrapping
    const legend = g.append("g")
      .attr("transform", `translate(0, ${height + 50})`)

    let legendX = 0
    let legendY = 0
    const maxLegendWidth = width - 20 // Leave some margin
    const lineHeight = 15

    thresholds.forEach((threshold, i) => {
      // Calculate approximate text width
      const textWidth = threshold.name.length * 6 + 30
      
      // Check if we need to wrap to next line
      if (legendX + textWidth > maxLegendWidth && legendX > 0) {
        legendX = 0
        legendY += lineHeight
      }

      const legendItem = legend.append("g")
        .attr("transform", `translate(${legendX}, ${legendY})`)

      legendItem.append("line")
        .attr("x1", 0)
        .attr("x2", 15)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", threshold.color)
        .attr("stroke-width", 2)

      legendItem.append("text")
        .attr("x", 20)
        .attr("y", 0)
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .text(threshold.name)

      legendX += textWidth
    })
  }, [thresholds, xParameter, xUnit, yUnit, name, lineType])

  // Draw chart when thresholds change
  useEffect(() => {
    if (!open) return
    // Add a small delay to ensure SVG is ready
    const timer = setTimeout(() => {
      drawChart()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [thresholds, open, xParameter, xUnit, yUnit, name, lineType, drawChart])

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

  const handleDragStart = (e: React.DragEvent, thresholdId: string) => {
    setDraggedThresholdId(thresholdId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (!draggedThresholdId) return

    const draggedIndex = thresholds.findIndex(t => t.id === draggedThresholdId)
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedThresholdId(null)
      setDragOverIndex(null)
      return
    }

    const newThresholds = [...thresholds]
    const [draggedThreshold] = newThresholds.splice(draggedIndex, 1)
    newThresholds.splice(targetIndex, 0, draggedThreshold)

    setThresholds(newThresholds)
    setDraggedThresholdId(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedThresholdId(null)
    setDragOverIndex(null)
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
      <DialogContent className="max-w-5xl w-[80vw] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {initialDefinition ? "Edit Interlock Definition" : "New Interlock Registration"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2">
          <div className="grid grid-cols-2 gap-2">
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

          <div className="grid grid-cols-2 gap-2">
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

          <div className="space-y-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Select Thresholds to Display</h4>
              <div className="flex flex-wrap gap-4">
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

            <div className="flex gap-4">
              <div className="flex-1 overflow-x-auto max-w-full">
                <Table 
                  className="text-sm table-fixed" 
                  style={{ 
                    minWidth: '600px' // テーブル幅を縮小
                  }}
                >
                  <TableHeader>
                    <TableRow className="h-6">
                      <TableHead className="sticky left-0 bg-background border-r px-2 py-1 text-xs text-left font-bold" style={{ width: '80px' }}>
                        {xParameter ? `${xParameter} (${xUnit || ''})` : 'X'}
                      </TableHead>
                      {thresholds.map((threshold, index) => (
                        <TableHead 
                          key={threshold.id} 
                          className={`px-1 py-1 text-left cursor-move select-none ${
                            draggedThresholdId === threshold.id ? 'opacity-50' : ''
                          } ${
                            dragOverIndex === index ? 'bg-blue-100 border-l-2 border-blue-400' : ''
                          }`}
                          style={{ width: '100px' }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, threshold.id)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                        >
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
                                  className="h-4 text-xs px-1 flex-1 min-w-0"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingThresholdName(threshold.id)}
                                  className="text-xs truncate text-left flex-1 min-w-0 hover:bg-muted px-1 py-0.5 rounded"
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
                      <TableHead className="px-1" style={{ width: '40px' }}></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedXValues.map((x, idx) => (
                      <TableRow key={idx} className={`h-6 ${idx % 2 === 0 ? 'bg-white' : 'bg-muted/30'}`}>
                        <TableCell className={`sticky left-0 border-r px-2 py-1 text-left font-bold ${idx % 2 === 0 ? 'bg-white' : 'bg-muted/30'}`}>
                          <Input
                            type="number"
                            value={x}
                            onChange={(e) => handleXChange(x, parseFloat(e.target.value) || 0)}
                            className="h-5 w-full text-xs px-1 bg-transparent font-bold"
                          />
                        </TableCell>
                        {thresholds.map((threshold, index) => (
                          <TableCell 
                            key={threshold.id} 
                            className={`px-1 py-1 text-left ${
                              dragOverIndex === index 
                                ? 'bg-blue-100' 
                                : idx % 2 === 0 ? 'bg-white' : 'bg-muted/30'
                            }`}
                          >
                            <Input
                              type="number"
                              value={valueMap.get(x)?.get(threshold.id) || 0}
                              onChange={(e) => handleCellChange(x, threshold.id, parseFloat(e.target.value) || 0)}
                              className="h-5 w-full text-xs px-1"
                            />
                          </TableCell>
                        ))}
                        <TableCell className={`px-1 py-1 ${idx % 2 === 0 ? 'bg-white' : 'bg-muted/30'}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRow(x)}
                            className="h-5 w-5 p-0"
                            disabled={sortedXValues.length <= 1}
                          >
                            <Trash2 className="h-2 w-2" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex-shrink-0 border-l pl-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Interlock Graph</h4>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="line-type" className="text-xs">Line Type:</Label>
                      <select
                        id="line-type"
                        value={lineType}
                        onChange={(e) => setLineType(e.target.value as "linear" | "step" | "stepBefore" | "stepAfter")}
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="linear">Linear</option>
                        <option value="step">Step</option>
                        <option value="stepBefore">Step Before</option>
                        <option value="stepAfter">Step After</option>
                      </select>
                    </div>
                  </div>
                  <div className="border rounded-lg p-2 bg-white">
                    <svg
                      ref={svgRef}
                      width="420"
                      height="330"
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
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