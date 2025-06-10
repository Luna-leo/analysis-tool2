"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { InterlockThreshold } from "@/types"

interface ThresholdTableRowProps {
  x: number
  rowIndex: number
  thresholds: InterlockThreshold[]
  valueMap: Map<number, Map<string, number>>
  dragOverIndex: number | null
  onXChange: (rowIndex: number, oldX: number, newX: number) => void
  onCellChange: (x: number, thresholdId: string, value: string) => void
  onRemoveRow: (x: number) => void
  canRemove: boolean
}

export function ThresholdTableRowFixed({
  x,
  rowIndex,
  thresholds,
  valueMap,
  dragOverIndex,
  onXChange,
  onCellChange,
  onRemoveRow,
  canRemove
}: ThresholdTableRowProps) {
  const [localXValue, setLocalXValue] = useState(x.toString())

  useEffect(() => {
    setLocalXValue(x.toString())
  }, [x])

  const handleXBlur = () => {
    const newX = parseFloat(localXValue)
    if (!isNaN(newX) && newX !== x) {
      onXChange(rowIndex, x, newX)
    } else {
      // Reset to original value if invalid
      setLocalXValue(x.toString())
    }
  }

  const handleXKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleXBlur()
      e.currentTarget.blur()
    }
  }

  return (
    <tr className="group hover:bg-blue-50 transition-colors border-b border-gray-100">
      <td className="bg-white border-r-2 border-gray-200 px-2 py-1 font-medium sticky left-0 z-20">
        <Input
          type="number"
          value={localXValue}
          onChange={(e) => setLocalXValue(e.target.value)}
          onBlur={handleXBlur}
          onKeyDown={handleXKeyDown}
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
            onChange={(e) => onCellChange(x, threshold.id, e.target.value)}
            className="h-6 w-full text-xs px-1 text-center border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            placeholder="-"
          />
        </td>
      ))}
      <td className="px-1 py-1 bg-white sticky right-0 z-20 border-l-2 border-gray-200 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemoveRow(x)}
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
          disabled={!canRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </td>
    </tr>
  )
}