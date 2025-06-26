"use client"

import React, { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { InterlockThreshold } from "@/types"

interface ThresholdCellProps {
  x: number
  threshold: InterlockThreshold
  value: number | undefined
  isHighlighted: boolean
  onCellChange: (x: number, thresholdId: string, value: string) => void
}

const ThresholdCell = React.memo(({ x, threshold, value, isHighlighted, onCellChange }: ThresholdCellProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onCellChange(x, threshold.id, e.target.value)
  }, [x, threshold.id, onCellChange])

  return (
    <td className={`px-1 py-1 ${isHighlighted ? 'bg-blue-50' : 'bg-white group-hover:bg-blue-50'}`}>
      <Input
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        className="h-6 w-full text-xs px-1 text-center border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
        placeholder="-"
      />
    </td>
  )
})

ThresholdCell.displayName = 'ThresholdCell'

interface ThresholdTableRowProps {
  x: number
  thresholds: InterlockThreshold[]
  valueMap: Map<number, Map<string, number>>
  dragOverIndex: number | null
  onXChange: (oldX: number, newX: number) => void
  onCellChange: (x: number, thresholdId: string, value: string) => void
  onRemoveRow: (x: number) => void
  canRemove: boolean
}

export const ThresholdTableRow = React.memo(({
  x,
  thresholds,
  valueMap,
  dragOverIndex,
  onXChange,
  onCellChange,
  onRemoveRow,
  canRemove
}: ThresholdTableRowProps) => {
  const handleXChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onXChange(x, parseFloat(e.target.value) || 0)
  }, [x, onXChange])

  const handleRemove = useCallback(() => {
    onRemoveRow(x)
  }, [x, onRemoveRow])
  return (
    <tr className="group hover:bg-blue-50 transition-colors border-b border-gray-100">
      <td className="bg-white border-r-2 border-gray-200 px-2 py-1 font-medium sticky left-0 z-20">
        <Input
          type="number"
          value={x}
          onChange={handleXChange}
          className="h-6 w-full text-xs px-1 font-semibold bg-gray-50 border-gray-300 focus:bg-white"
        />
      </td>
      {thresholds.map((threshold, index) => (
        <ThresholdCell
          key={threshold.id}
          x={x}
          threshold={threshold}
          value={valueMap.get(x)?.get(threshold.id)}
          isHighlighted={dragOverIndex === index}
          onCellChange={onCellChange}
        />
      ))}
      <td className="px-1 py-1 bg-white sticky right-0 z-20 border-l-2 border-gray-200 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
          disabled={!canRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </td>
    </tr>
  )
})