import { useState } from "react"
import { InterlockThreshold } from "@/types"

export function useThresholdDragAndDrop(
  thresholds: InterlockThreshold[],
  onUpdateThresholds: (thresholds: InterlockThreshold[]) => void
) {
  const [draggedThresholdId, setDraggedThresholdId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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

  return {
    draggedThresholdId,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  }
}