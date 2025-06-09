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
import { ThresholdTableRow } from "./ThresholdTableRow"

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

    const updatedThresholds = thresholds.map((threshold, index) => {
      if (index === 0) {
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
    const newThreshold = generateNewThreshold(thresholds, sortedXValues)
    onUpdateThresholds([...thresholds, newThreshold])
  }

  const handleRemoveRow = (x: number) => {
    const updatedThresholds = thresholds.map(threshold => ({
      ...threshold,
      points: threshold.points.filter(point => point.x !== x)
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
                  <ThresholdTableRow
                    key={idx}
                    x={x}
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

export { ThresholdHeader } from "./ThresholdHeader"
export { ThresholdTableHeader } from "./ThresholdTableHeader"
export { ThresholdTableRow } from "./ThresholdTableRow"