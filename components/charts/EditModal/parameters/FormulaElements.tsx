"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { X, GripVertical } from "lucide-react"
import { FormulaElement } from "./FormulaBuilder"

interface FormulaElementsProps {
  elements: FormulaElement[]
  onRemoveElement: (id: string) => void
  onMoveElement: (fromIndex: number, toIndex: number) => void
}

export function FormulaElements({ elements, onRemoveElement, onMoveElement }: FormulaElementsProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      onMoveElement(draggedIndex, index)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div>
      {/* Current formula display */}
      <div className="border-2 border-dashed rounded-lg p-4 min-h-[80px] bg-muted/10 mb-4">
        <Label className="text-xs text-muted-foreground mb-2 block">Current Formula</Label>
        <div className="flex flex-wrap gap-1.5 items-center min-h-[40px]">
          {elements.length === 0 ? (
            <span className="text-sm text-muted-foreground italic">Start building your formula by clicking the buttons below...</span>
          ) : (
            elements.map((element, index) => (
              <Badge
                key={element.id}
                variant={element.type === "parameter" ? "default" : 
                        element.type === "number" ? "outline" : 
                        element.type === "constant" ? "secondary" : "secondary"}
                className={`px-3 py-1.5 flex items-center gap-1 text-sm cursor-move transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverIndex === index ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <GripVertical className="h-3 w-3 text-muted-foreground" />
                <span>{element.displayName || element.value}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveElement(element.id)
                  }}
                  className="ml-1 hover:text-destructive transition-colors"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Formula Preview */}
      {elements.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <Label className="text-xs text-muted-foreground mb-1 block">Formula Expression</Label>
          <div className="font-mono text-sm bg-white border rounded px-3 py-2">
            {elements.map(elem => elem.value).join(" ")}
          </div>
        </div>
      )}
    </div>
  )
}