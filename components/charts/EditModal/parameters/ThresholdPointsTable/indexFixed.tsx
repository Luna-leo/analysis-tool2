"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { InterlockThreshold } from "@/types"
import { useThresholdDragAndDrop } from "@/hooks/useThresholdDragAndDrop"
import { 
  getUniqueXValues, 
  createValueMap, 
  generateNewThreshold, 
  updateThresholdPoint 
} from "@/utils/thresholdUtils"
import { ThresholdHeader } from "./ThresholdHeader"
import { ThresholdTableHeader } from "./ThresholdTableHeader"
import { ThresholdTableRowFixed } from "./ThresholdTableRowFixed"

interface ThresholdPointsTableProps {
  thresholds: InterlockThreshold[]
  onUpdateThresholds: (thresholds: InterlockThreshold[]) => void
  xParameter?: string
  xUnit?: string
  lineType?: string
  onLineTypeChange?: (lineType: string) => void
}

export function ThresholdPointsTableFixed({
  thresholds,
  onUpdateThresholds,
  xParameter,
  xUnit,
  lineType,
  onLineTypeChange
}: ThresholdPointsTableProps) {
  const {
    draggedThresholdId,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  } = useThresholdDragAndDrop(thresholds, onUpdateThresholds)

  const sortedXValues = getUniqueXValues(thresholds)
  const valueMap = createValueMap(thresholds, sortedXValues)

  const handleCellChange = (x: number, thresholdId: string, value: string) => {
    const updatedThresholds = thresholds.map(threshold => {
      if (threshold.id === thresholdId) {
        return updateThresholdPoint(threshold, x, value)
      }
      return threshold
    })
    onUpdateThresholds(updatedThresholds)
  }

  const handleXChange = (rowIndex: number, oldX: number, newX: number) => {
    // Check if newX already exists
    const existingX = sortedXValues.find(x => Math.abs(x - newX) < 0.0001 && x !== oldX)
    if (existingX !== undefined) {
      alert(`X value ${newX} already exists. Please use a unique value.`)
      return
    }

    // Update all thresholds with the new X value
    const updatedThresholds = thresholds.map(threshold => {
      const newPoints = threshold.points.map(point => {
        // Use approximate comparison for floating point numbers
        if (Math.abs(point.x - oldX) < 0.0001) {
          return { ...point, x: newX }
        }
        return point
      })
      // Sort points by X value to maintain order
      return { 
        ...threshold, 
        points: newPoints.sort((a, b) => a.x - b.x) 
      }
    })
    
    onUpdateThresholds(updatedThresholds)
  }

  const handleAddRow = () => {
    const maxX = Math.max(...sortedXValues, 0)
    const newX = Math.round((maxX + 10) * 100) / 100 // Round to 2 decimal places

    const updatedThresholds = thresholds.map((threshold, index) => {
      // Add new point to the first threshold with a default Y value
      if (index === 0) {
        const lastPoint = threshold.points[threshold.points.length - 1]
        const newY = lastPoint ? lastPoint.y : 0
        return {
          ...threshold,
          points: [...threshold.points, { x: newX, y: newY }].sort((a, b) => a.x - b.x)
        }
      }
      // For other thresholds, add point with null/zero Y value
      return {
        ...threshold,
        points: [...threshold.points, { x: newX, y: 0 }].sort((a, b) => a.x - b.x)
      }
    })
    onUpdateThresholds(updatedThresholds)
  }

  const handleAddThreshold = () => {
    const newThreshold = generateNewThreshold(thresholds, sortedXValues)
    onUpdateThresholds([...thresholds, newThreshold])
  }

  const handleRemoveRow = (x: number) => {
    const updatedThresholds = thresholds.map(threshold => ({
      ...threshold,
      points: threshold.points.filter(point => Math.abs(point.x - x) > 0.0001)
    }))
    onUpdateThresholds(updatedThresholds)
  }

  return (
    <div className="h-full flex flex-col">
      <ThresholdHeader lineType={lineType} onLineTypeChange={onLineTypeChange} />
      
      <div className="mt-3">
        <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-auto relative" style={{ maxHeight: '300px' }}>
            <table 
              className="text-sm w-full border-collapse" 
              style={{ 
                minWidth: `${80 + (thresholds.length * 90) + 40}px`
              }}
            >
              <ThresholdTableHeader
                thresholds={thresholds}
                xParameter={xParameter}
                xUnit={xUnit}
                draggedThresholdId={draggedThresholdId}
                dragOverIndex={dragOverIndex}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onAddThreshold={handleAddThreshold}
              />
              <tbody>
                {sortedXValues.map((x, idx) => (
                  <ThresholdTableRowFixed
                    key={`row-${idx}-${x}`}
                    x={x}
                    rowIndex={idx}
                    thresholds={thresholds}
                    valueMap={valueMap}
                    dragOverIndex={dragOverIndex}
                    onXChange={handleXChange}
                    onCellChange={handleCellChange}
                    onRemoveRow={handleRemoveRow}
                    canRemove={sortedXValues.length > 1}
                  />
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