"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus } from "lucide-react"
import { InterlockThreshold } from "@/types"

interface ThresholdPointsTableProps {
  thresholds: InterlockThreshold[]
  onUpdateThresholds: (thresholds: InterlockThreshold[]) => void
  xParameter?: string
  xUnit?: string
  lineType?: string
  onLineTypeChange?: (lineType: string) => void
}

export function ThresholdPointsTable({
  thresholds,
  onUpdateThresholds,
  xParameter,
  xUnit,
  lineType,
  onLineTypeChange
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

  const handleAddThreshold = () => {
    // Generate a new threshold with default values
    const newThresholdId = `threshold_${Date.now()}`
    const defaultColors = ["#FFA500", "#FF0000", "#0000FF", "#00FF00", "#800080"]
    const usedColors = thresholds.map(t => t.color)
    const newColor = defaultColors.find(color => !usedColors.includes(color)) || "#" + Math.floor(Math.random()*16777215).toString(16)
    
    const newThreshold: InterlockThreshold = {
      id: newThresholdId,
      name: `Threshold ${thresholds.length + 1}`,
      color: newColor,
      points: sortedXValues.map(x => ({ x, y: 0 }))
    }
    
    onUpdateThresholds([...thresholds, newThreshold])
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
    <div className="h-full flex flex-col">
      <div className="shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Threshold Points</h4>
          
          {/* Line Type Selection */}
          {lineType !== undefined && onLineTypeChange && (
            <div className="flex items-center gap-2">
              <Label htmlFor="line-type" className="text-sm font-medium text-gray-700">
                Line Type:
              </Label>
              <select
                id="line-type"
                value={lineType}
                onChange={(e) => onLineTypeChange(e.target.value)}
                className="h-8 w-36 text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              >
                <option value="linear">Linear</option>
                <option value="step">Step</option>
                <option value="stepBefore">Step Before</option>
                <option value="stepAfter">Step After</option>
              </select>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-3">
        <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-auto relative" style={{ maxHeight: '300px' }}>
            <table 
              className="text-sm w-full border-collapse" 
              style={{ 
                minWidth: `${80 + (thresholds.length * 90) + 40}px`
              }}
            >
              <thead className="sticky top-0 z-30">
                <tr className="bg-white border-b-2 border-gray-200">
                  <th 
                    className="bg-gray-50 border-r-2 border-gray-200 px-2 py-2 text-sm font-semibold text-gray-700 sticky left-0 z-40 text-left top-0" 
                    style={{ width: '80px' }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="truncate">
                        {xParameter || 'X'}
                      </span>
                      {xUnit && (
                        <span className="text-gray-500 font-normal">({xUnit})</span>
                      )}
                    </div>
                  </th>
                {thresholds.map((threshold, index) => (
                  <th 
                    key={threshold.id} 
                    className={`px-2 py-2 text-center cursor-move select-none transition-all bg-gray-50 ${
                      draggedThresholdId === threshold.id ? 'opacity-40' : ''
                    } ${
                      dragOverIndex === index 
                        ? 'bg-blue-100 border-l-4 border-blue-400' 
                        : 'hover:bg-gray-100'
                    }`}
                    style={{ width: '90px' }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, threshold.id)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-semibold text-gray-700 truncate max-w-full px-1">
                        {threshold.name}
                      </span>
                      <div 
                        className="w-full h-1 rounded-full" 
                        style={{ backgroundColor: threshold.color }}
                      />
                    </div>
                  </th>
                ))}
                <th 
                  className="bg-gray-50 px-1 sticky right-0 z-40 border-l-2 border-gray-200" 
                  style={{ width: '40px' }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddThreshold}
                    className="h-5 w-5 p-0 hover:bg-gray-100"
                    title="Add Column"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedXValues.map((x, idx) => (
                <tr 
                  key={idx} 
                  className="group hover:bg-blue-50 transition-colors border-b border-gray-100"
                >
                  <td 
                    className="bg-white border-r-2 border-gray-200 px-2 py-1 font-medium sticky left-0 z-20"
                  >
                    <Input
                      type="number"
                      value={x}
                      onChange={(e) => handleXChange(x, parseFloat(e.target.value) || 0)}
                      className="h-6 w-full text-xs px-1 font-semibold bg-gray-50 border-gray-300 focus:bg-white"
                    />
                  </td>
                  {thresholds.map((threshold, index) => (
                    <td 
                      key={threshold.id} 
                      className={`px-1 py-1 ${
                        dragOverIndex === index 
                          ? 'bg-blue-50' 
                          : 'bg-white group-hover:bg-blue-50'
                      }`}
                    >
                      <Input
                        type="number"
                        value={valueMap.get(x)?.get(threshold.id) ?? ''}
                        onChange={(e) => handleCellChange(x, threshold.id, e.target.value)}
                        className="h-6 w-full text-xs px-1 text-center border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        placeholder="-"
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1 bg-white sticky right-0 z-20 border-l-2 border-gray-200 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRow(x)}
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                      disabled={sortedXValues.length <= 1}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 px-2 py-1 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddRow}
              className="h-6 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Row
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}