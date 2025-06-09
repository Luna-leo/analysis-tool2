"use client"

import { useState, useRef } from "react"

interface DragState {
  id: string
  type: 'vertical' | 'horizontal'
}

interface LabelDragPosition {
  [key: string]: { x: number; y: number }
}

export function useReferenceLineDrag() {
  const [draggingLine, setDraggingLine] = useState<DragState | null>(null)
  const [draggingLabel, setDraggingLabel] = useState<DragState | null>(null)
  const dragPositionRef = useRef<{ [key: string]: number }>({})
  const labelDragPositionRef = useRef<LabelDragPosition>({})

  const startLineDrag = (id: string, type: 'vertical' | 'horizontal') => {
    setDraggingLine({ id, type })
  }

  const updateLineDragPosition = (id: string, position: number) => {
    dragPositionRef.current[id] = position
  }

  const endLineDrag = () => {
    setDraggingLine(null)
  }

  const clearLineDragPosition = (id: string) => {
    delete dragPositionRef.current[id]
  }

  const startLabelDrag = (id: string, type: 'vertical' | 'horizontal', x: number, y: number) => {
    setDraggingLabel({ id, type })
    labelDragPositionRef.current[id] = { x, y }
  }

  const updateLabelDragPosition = (id: string, x: number, y: number) => {
    labelDragPositionRef.current[id] = { x, y }
  }

  const endLabelDrag = () => {
    setDraggingLabel(null)
  }

  const clearLabelDragPosition = (id: string) => {
    delete labelDragPositionRef.current[id]
  }

  const getLineDragPosition = (id: string) => {
    return dragPositionRef.current[id]
  }

  const getLabelDragPosition = (id: string) => {
    return labelDragPositionRef.current[id]
  }

  const isLineDragging = (id: string) => {
    return draggingLine?.id === id
  }

  const isLabelDragging = (id: string) => {
    return draggingLabel?.id === id
  }

  return {
    draggingLine,
    draggingLabel,
    startLineDrag,
    updateLineDragPosition,
    endLineDrag,
    clearLineDragPosition,
    startLabelDrag,
    updateLabelDragPosition,
    endLabelDrag,
    clearLabelDragPosition,
    getLineDragPosition,
    getLabelDragPosition,
    isLineDragging,
    isLabelDragging
  }
}