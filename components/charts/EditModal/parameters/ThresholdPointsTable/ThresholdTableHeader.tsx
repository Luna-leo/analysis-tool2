"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { InterlockThreshold } from "@/types"

interface ThresholdTableHeaderProps {
  thresholds: InterlockThreshold[]
  xParameter?: string
  xUnit?: string
  draggedThresholdId: string | null
  dragOverIndex: number | null
  onDragStart: (e: React.DragEvent, thresholdId: string) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  onAddThreshold: () => void
}

export function ThresholdTableHeader({
  thresholds,
  xParameter,
  xUnit,
  draggedThresholdId,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onAddThreshold
}: ThresholdTableHeaderProps) {
  return (
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
            onDragStart={(e) => onDragStart(e, threshold.id)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, index)}
            onDragEnd={onDragEnd}
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
            onClick={onAddThreshold}
            className="h-5 w-5 p-0 hover:bg-gray-100"
            title="Add Column"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </th>
      </tr>
    </thead>
  )
}