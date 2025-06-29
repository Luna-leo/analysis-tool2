import { useReducer, useRef, useCallback } from 'react'
import * as d3 from 'd3'

interface InteractionState {
  zoomTransform: d3.ZoomTransform
  isZooming: boolean
  isPanning: boolean
  isDragging: boolean
  isHovering: boolean
  hoveredPoint: any | null
  selectedRange: [number, number] | null
}

type InteractionAction =
  | { type: 'SET_ZOOM'; transform: d3.ZoomTransform }
  | { type: 'START_ZOOM' }
  | { type: 'END_ZOOM' }
  | { type: 'START_PAN' }
  | { type: 'END_PAN' }
  | { type: 'START_DRAG' }
  | { type: 'END_DRAG' }
  | { type: 'SET_HOVER'; point: any | null }
  | { type: 'SET_SELECTION'; range: [number, number] | null }
  | { type: 'RESET' }

const initialState: InteractionState = {
  zoomTransform: d3.zoomIdentity,
  isZooming: false,
  isPanning: false,
  isDragging: false,
  isHovering: false,
  hoveredPoint: null,
  selectedRange: null
}

function interactionReducer(state: InteractionState, action: InteractionAction): InteractionState {
  switch (action.type) {
    case 'SET_ZOOM':
      return {
        ...state,
        zoomTransform: action.transform
      }
    case 'START_ZOOM':
      return {
        ...state,
        isZooming: true
      }
    case 'END_ZOOM':
      return {
        ...state,
        isZooming: false
      }
    case 'START_PAN':
      return {
        ...state,
        isPanning: true
      }
    case 'END_PAN':
      return {
        ...state,
        isPanning: false
      }
    case 'START_DRAG':
      return {
        ...state,
        isDragging: true
      }
    case 'END_DRAG':
      return {
        ...state,
        isDragging: false
      }
    case 'SET_HOVER':
      return {
        ...state,
        isHovering: action.point !== null,
        hoveredPoint: action.point
      }
    case 'SET_SELECTION':
      return {
        ...state,
        selectedRange: action.range
      }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

interface UseChartInteractionStateReturn {
  state: InteractionState
  actions: {
    setZoom: (transform: d3.ZoomTransform) => void
    startZoom: () => void
    endZoom: () => void
    startPan: () => void
    endPan: () => void
    startDrag: () => void
    endDrag: () => void
    setHover: (point: any | null) => void
    setSelection: (range: [number, number] | null) => void
    reset: () => void
  }
  // Refs for accessing state without triggering re-renders
  stateRef: React.MutableRefObject<InteractionState>
  isInteracting: boolean
}

/**
 * Hook to manage chart interaction state with batched updates
 * Uses a reducer to ensure consistent state updates
 */
export function useChartInteractionState(): UseChartInteractionStateReturn {
  const [state, dispatch] = useReducer(interactionReducer, initialState)
  const stateRef = useRef(state)
  
  // Update ref when state changes
  stateRef.current = state
  
  // Create stable action callbacks
  const actions = {
    setZoom: useCallback((transform: d3.ZoomTransform) => {
      dispatch({ type: 'SET_ZOOM', transform })
    }, []),
    
    startZoom: useCallback(() => {
      dispatch({ type: 'START_ZOOM' })
    }, []),
    
    endZoom: useCallback(() => {
      dispatch({ type: 'END_ZOOM' })
    }, []),
    
    startPan: useCallback(() => {
      dispatch({ type: 'START_PAN' })
    }, []),
    
    endPan: useCallback(() => {
      dispatch({ type: 'END_PAN' })
    }, []),
    
    startDrag: useCallback(() => {
      dispatch({ type: 'START_DRAG' })
    }, []),
    
    endDrag: useCallback(() => {
      dispatch({ type: 'END_DRAG' })
    }, []),
    
    setHover: useCallback((point: any | null) => {
      dispatch({ type: 'SET_HOVER', point })
    }, []),
    
    setSelection: useCallback((range: [number, number] | null) => {
      dispatch({ type: 'SET_SELECTION', range })
    }, []),
    
    reset: useCallback(() => {
      dispatch({ type: 'RESET' })
    }, [])
  }
  
  // Compute if user is currently interacting
  const isInteracting = state.isZooming || state.isPanning || state.isDragging
  
  return {
    state,
    actions,
    stateRef,
    isInteracting
  }
}