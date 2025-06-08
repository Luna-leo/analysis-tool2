"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus } from "lucide-react"
import { InterlockThreshold } from "@/types"

interface ThresholdPointsTableProps {
  thresholds: InterlockThreshold[]
  onUpdateThresholds: (thresholds: InterlockThreshold[]) => void
  xParameter?: string
  xUnit?: string
}

export function ThresholdPointsTable({
  thresholds,
  onUpdateThresholds,
  xParameter,
  xUnit
}: ThresholdPointsTableProps) {
  const [draggedThresholdId, setDraggedThresholdId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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

  const handleCellChange = (x: number, thresholdId: string, value: string) => {
    const updatedThresholds = thresholds.map(threshold => {
      if (threshold.id === thresholdId) {
        // If value is empty, remove the point
        if (value === '') {
          const newPoints = threshold.points.filter(point => point.x !== x)
          return { ...threshold, points: newPoints }
        }
        
        const numValue = parseFloat(value)
        if (isNaN(numValue)) return threshold
        
        const existingPointIndex = threshold.points.findIndex(p => p.x === x)
        
        if (existingPointIndex >= 0) {
          // Update existing point
          const newPoints = [...threshold.points]
          newPoints[existingPointIndex] = { x, y: numValue }
          return { ...threshold, points: newPoints }
        } else {
          // Add new point
          const newPoints = [...threshold.points, { x, y: numValue }]
          newPoints.sort((a, b) => a.x - b.x)
          return { ...threshold, points: newPoints }
        }
      }
      return threshold
    })
    onUpdateThresholds(updatedThresholds)
  }

  const handleXChange = (oldX: number, newX: number) => {
    const updatedThresholds = thresholds.map(threshold => {
      const newPoints = threshold.points.map(point =>
        point.x === oldX ? { ...point, x: newX } : point
      )
      return { ...threshold, points: newPoints }
    })
    onUpdateThresholds(updatedThresholds)
  }

  const handleAddRow = () => {
    const maxX = Math.max(...sortedXValues, 0)
    const newX = maxX + 10

    // Add a new X value to at least the first threshold to ensure the row appears
    // Users can then fill in values for other thresholds as needed
    const updatedThresholds = thresholds.map((threshold, index) => {
      if (index === 0) {
        // Only add to the first threshold to create the row
        const lastPoint = threshold.points[threshold.points.length - 1]
        const newY = lastPoint ? lastPoint.y : 0
        return {
          ...threshold,
          points: [...threshold.points, { x: newX, y: newY }].sort((a, b) => a.x - b.x)
        }
      }
      return threshold
    })
    onUpdateThresholds(updatedThresholds)
  }

  const handleRemoveRow = (x: number) => {
    const updatedThresholds = thresholds.map(threshold => ({
      ...threshold,
      points: threshold.points.filter(point => point.x !== x)
    }))
    onUpdateThresholds(updatedThresholds)
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

    onUpdateThresholds(newThresholds)
    setDraggedThresholdId(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedThresholdId(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Threshold Points</h4>
      <div className="overflow-x-auto">
        <Table 
          className="text-sm table-fixed" 
          style={{ 
            minWidth: `${80 + (thresholds.length * 100) + 30}px`
          }}
        >
          <TableHeader>
            <TableRow className="h-6 bg-slate-100">
              <TableHead className="sticky left-0 bg-slate-200 border-r px-2 py-1 text-xs text-left font-bold" style={{ width: '80px' }}>
                {xParameter ? `${xParameter} (${xUnit || ''})` : 'X'}
              </TableHead>
              {thresholds.map((threshold, index) => (
                <TableHead 
                  key={threshold.id} 
                  className={`px-1 py-1 text-left cursor-move select-none font-bold ${
                    draggedThresholdId === threshold.id ? 'opacity-50' : ''
                  } ${
                    dragOverIndex === index ? 'bg-blue-200 border-l-2 border-blue-400' : 'bg-slate-100'
                  }`}
                  style={{ width: '100px' }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, threshold.id)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="text-xs truncate">{threshold.name}</span>
                </TableHead>
              ))}
              <TableHead className="px-1 bg-slate-100" style={{ width: '30px' }}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedXValues.map((x, idx) => (
              <TableRow key={idx} className={`h-6 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-200'}`}>
                <TableCell className={`sticky left-0 border-r px-2 py-1 text-left font-bold ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-200'}`}>
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
                        : idx % 2 === 0 ? 'bg-white' : 'bg-gray-200'
                    }`}
                  >
                    <Input
                      type="number"
                      value={valueMap.get(x)?.get(threshold.id) ?? ''}
                      onChange={(e) => handleCellChange(x, threshold.id, e.target.value)}
                      className="h-5 w-full text-xs px-1"
                      placeholder="-"
                    />
                  </TableCell>
                ))}
                <TableCell className={`px-1 py-1 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-200'}`}>
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
            <TableRow className="h-6">
              <TableCell className="sticky left-0 border-r px-2 py-1 text-left bg-gray-50" colSpan={thresholds.length + 2}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddRow}
                  className="h-5 text-xs justify-start"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Row
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}