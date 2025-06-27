"use client"

import { useState, useRef, useCallback, useReducer } from "react"
import { throttle } from "lodash"

interface DragState {
  id: string
  type: 'vertical' | 'horizontal'
}

interface LabelDragPosition {
  [key: string]: { x: number; y: number }
}

export function useReferenceLineDrag() {
  // Use refs for drag state to minimize re-renders
  const draggingLineRef = useRef<DragState | null>(null)
  const draggingLabelRef = useRef<DragState | null>(null)
  const dragPositionRef = useRef<{ [key: string]: number }>({})
  const labelDragPositionRef = useRef<LabelDragPosition>({})
  
  // Single state update for UI refresh when drag starts/ends
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  
  // Keep state for components that need to re-render on drag state changes
  const [draggingLine, setDraggingLine] = useState<DragState | null>(null)
  const [draggingLabel, setDraggingLabel] = useState<DragState | null>(null)

  const startLineDrag = useCallback((id: string, type: 'vertical' | 'horizontal') => {
    const state = { id, type }
    draggingLineRef.current = state
    setDraggingLine(state)
  }, [])

  // Throttle position updates for better performance
  const updateLineDragPosition = useCallback(
    throttle((id: string, position: number) => {
      dragPositionRef.current[id] = position
    }, 16), // ~60fps
    []
  )

  const endLineDrag = useCallback(() => {
    draggingLineRef.current = null
    setDraggingLine(null)
  }, [])

  const clearLineDragPosition = useCallback((id: string) => {
    delete dragPositionRef.current[id]
  }, [])

  const startLabelDrag = useCallback((id: string, type: 'vertical' | 'horizontal', x: number, y: number) => {
    const state = { id, type }
    draggingLabelRef.current = state
    setDraggingLabel(state)
    labelDragPositionRef.current[id] = { x, y }
  }, [])

  // Throttle label position updates
  const updateLabelDragPosition = useCallback(
    throttle((id: string, x: number, y: number) => {
      labelDragPositionRef.current[id] = { x, y }
    }, 16), // ~60fps
    []
  )

  const endLabelDrag = useCallback(() => {
    draggingLabelRef.current = null
    setDraggingLabel(null)
  }, [])

  const clearLabelDragPosition = useCallback((id: string) => {
    delete labelDragPositionRef.current[id]
  }, [])

  const getLineDragPosition = useCallback((id: string) => {
    return dragPositionRef.current[id]
  }, [])

  const getLabelDragPosition = useCallback((id: string) => {
    return labelDragPositionRef.current[id]
  }, [])

  const isLineDragging = useCallback((id: string) => {
    return draggingLineRef.current?.id === id
  }, [])

  const isLabelDragging = useCallback((id: string) => {
    return draggingLabelRef.current?.id === id
  }, [])

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