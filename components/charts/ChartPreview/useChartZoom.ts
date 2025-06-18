import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface UseChartZoomProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  width: number;
  height: number;
  minZoom?: number;
  maxZoom?: number;
  enablePan?: boolean;
  enableZoom?: boolean;
  onZoom?: (transform: d3.ZoomTransform) => void;
  onZoomStart?: () => void;
  onZoomEnd?: () => void;
  margin?: { top: number; right: number; bottom: number; left: number };
  chartId?: string;
  enableRangeSelection?: boolean;
}

interface ZoomState {
  k: number;
  x: number;
  y: number;
  transform: d3.ZoomTransform;
}

interface SelectionState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Debounce function for localStorage writes
const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const useChartZoom = ({
  svgRef,
  width,
  height,
  minZoom = 0.5,
  maxZoom = 10,
  enablePan = true,
  enableZoom = true,
  onZoom,
  onZoomStart,
  onZoomEnd,
  margin = { top: 20, right: 40, bottom: 60, left: 60 },
  chartId,
  enableRangeSelection = true,
}: UseChartZoomProps) => {
  // Load initial state from localStorage
  const getInitialZoomState = useCallback((): ZoomState => {
    if (!chartId) {
      return { k: 1, x: 0, y: 0, transform: d3.zoomIdentity };
    }
    
    try {
      const savedState = localStorage.getItem(`chart-zoom-${chartId}`);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        const transform = d3.zoomIdentity
          .translate(parsed.x || 0, parsed.y || 0)
          .scale(parsed.k || 1);
        // console.log(`[useChartZoom] Loaded zoom state for chart ${chartId}:`, parsed);
        return {
          k: parsed.k || 1,
          x: parsed.x || 0,
          y: parsed.y || 0,
          transform
        };
      }
    } catch (error) {
      console.warn('Failed to load zoom state from localStorage:', error);
    }
    
    return { k: 1, x: 0, y: 0, transform: d3.zoomIdentity };
  }, [chartId]);

  const [zoomState, setZoomState] = useState<ZoomState>({ k: 1, x: 0, y: 0, transform: d3.zoomIdentity });
  const [selectionState, setSelectionState] = useState<SelectionState>({
    isSelecting: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  const hasInitialized = useRef(false);
  const isShiftPressed = useRef(false);
  const selectionRectRef = useRef<SVGRectElement | null>(null);
  
  // Debounced save function
  const saveZoomState = useCallback(
    debounce((state: ZoomState) => {
      if (!chartId) return;
      
      try {
        const data = {
          k: state.k,
          x: state.x,
          y: state.y,
          timestamp: Date.now()
        };
        localStorage.setItem(`chart-zoom-${chartId}`, JSON.stringify(data));
        // console.log(`[useChartZoom] Saved zoom state for chart ${chartId}:`, data);
      } catch (error) {
        console.warn('Failed to save zoom state to localStorage:', error);
      }
    }, 100),
    [chartId]
  );

  const handleZoom = useCallback((event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
    const { transform } = event;
    const newState = { 
      k: transform.k, 
      x: transform.x, 
      y: transform.y,
      transform 
    };
    
    console.log('[Zoom] Transform updated:', {
      k: transform.k,
      x: transform.x,
      y: transform.y,
      sourceEvent: event.sourceEvent?.type
    });
    
    setZoomState(newState);
    saveZoomState(newState);
    
    // Call external zoom handler if provided
    if (onZoom) {
      onZoom(transform);
    }
  }, [onZoom, saveZoomState]);

  // Handle range selection
  const handleRangeSelection = useCallback((startPoint: [number, number], endPoint: [number, number]) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;

    const svg = d3.select(svgRef.current);
    const currentTransform = d3.zoomTransform(svgRef.current);
    
    // Calculate the bounding box of the selection (in plot area coordinates)
    const x0 = Math.min(startPoint[0], endPoint[0]);
    const x1 = Math.max(startPoint[0], endPoint[0]);
    const y0 = Math.min(startPoint[1], endPoint[1]);
    const y1 = Math.max(startPoint[1], endPoint[1]);
    
    // Only process if selection is large enough
    if (Math.abs(x1 - x0) < 10 || Math.abs(y1 - y0) < 10) {
      console.log('[Range Selection] Selection too small, ignoring');
      return;
    }
    
    // Calculate the zoom scale and translate to fit the selection
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    
    const selectionWidth = x1 - x0;
    const selectionHeight = y1 - y0;
    
    // Calculate scale to fit selection (with some padding)
    const scaleX = plotWidth / selectionWidth;
    const scaleY = plotHeight / selectionHeight;
    const newScale = Math.min(scaleX, scaleY, maxZoom) * 0.9; // 90% to add padding
    
    // Calculate center of selection in plot coordinates
    const centerX = (x0 + x1) / 2;
    const centerY = (y0 + y1) / 2;
    
    // Convert center from plot coordinates to SVG coordinates
    const svgCenterX = centerX + margin.left;
    const svgCenterY = centerY + margin.top;
    
    // Calculate translation to center the selection in the SVG viewport
    // We want to move the scaled center point to the center of the SVG
    const svgWidth = width;
    const svgHeight = height;
    const translateX = svgWidth / 2 - svgCenterX * newScale;
    const translateY = svgHeight / 2 - svgCenterY * newScale;
    
    console.log('[Range Selection] Transform calculation:', {
      currentTransform: { k: currentTransform.k, x: currentTransform.x, y: currentTransform.y },
      selection: { x0, y0, x1, y1, width: selectionWidth, height: selectionHeight },
      plot: { width: plotWidth, height: plotHeight },
      scale: { scaleX, scaleY, current: currentTransform.k, new: newScale },
      center: { plotX: centerX, plotY: centerY, svgX: svgCenterX, svgY: svgCenterY },
      svg: { width: svgWidth, height: svgHeight },
      translate: { x: translateX, y: translateY }
    });
    
    // Create and apply the transform
    const transform = d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(newScale);
    
    // Apply with smooth transition
    console.log('[Range Selection] Applying transform:', {
      k: transform.k,
      x: transform.x,
      y: transform.y
    });
    
    svg.transition()
      .duration(400)
      .ease(d3.easeCubicInOut)
      .call(zoomBehaviorRef.current.transform, transform);
  }, [width, height, margin, maxZoom, svgRef]);

  useEffect(() => {
    if (!svgRef.current || !enableZoom) return;

    const svg = d3.select(svgRef.current);
    
    // Clear any existing zoom behavior
    svg.on('.zoom', null);

    // Track shift key state - only when mouse is over this specific SVG
    let isMouseOverSvg = false;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && isMouseOverSvg) {
        isShiftPressed.current = true;
        if (enableRangeSelection) {
          svg.style('cursor', 'crosshair');
        }
      }
    };
    
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        isShiftPressed.current = false;
        svg.style('cursor', enablePan ? 'grab' : 'default');
        // Clear any selection state
        setSelectionState({
          isSelecting: false,
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0,
        });
      }
    };

    // Track mouse enter/leave for this specific SVG
    if (enableRangeSelection) {
      svg.on('mouseenter', function(event: MouseEvent) {
        isMouseOverSvg = true;
        // Check if shift is already pressed
        if (event.shiftKey) {
          isShiftPressed.current = true;
          svg.style('cursor', 'crosshair');
        }
      });
      
      svg.on('mouseleave', () => {
        isMouseOverSvg = false;
        isShiftPressed.current = false;
        svg.style('cursor', enablePan ? 'grab' : 'default');
        // Clear selection if leaving while selecting
        setSelectionState({
          isSelecting: false,
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0,
        });
      });
      
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([minZoom, maxZoom])
      .extent([[0, 0], [width, height]])
      .translateExtent([[-Infinity, -Infinity], [Infinity, Infinity]])
      .filter((event) => {
        // If shift is pressed and range selection is enabled, don't process normal zoom/pan
        if (isShiftPressed.current && enableRangeSelection) {
          return false;
        }
        // Allow zoom on wheel events and drag, but not on double-click
        return !event.button && !event.ctrlKey && !event.type.includes('dblclick');
      })
      .on('start', () => {
        if (onZoomStart) {
          onZoomStart();
        }
      })
      .on('zoom', handleZoom)
      .on('end', () => {
        if (onZoomEnd) {
          onZoomEnd();
        }
      });

    zoomBehaviorRef.current = zoom;

    // Apply zoom behavior
    svg.call(zoom);

    // Handle range selection if enabled
    if (enableRangeSelection) {
      let selectionStart: [number, number] | null = null;
      
      svg.on('mousedown.selection', function(event) {
        if (!isShiftPressed.current) return;
        
        const [x, y] = d3.pointer(event, this);
        // Get coordinates relative to the plot area (inside margins)
        selectionStart = [x - margin.left, y - margin.top];
        
        console.log('[Range Selection] Start:', { 
          rawX: x, 
          rawY: y, 
          plotX: selectionStart[0], 
          plotY: selectionStart[1],
          margins: margin,
          currentTransform: zoomBehaviorRef.current?.transform ? d3.zoomTransform(this) : null
        });
        
        setSelectionState({
          isSelecting: true,
          startX: selectionStart[0],
          startY: selectionStart[1],
          endX: selectionStart[0],
          endY: selectionStart[1],
        });
        
        event.preventDefault();
      });
      
      svg.on('mousemove.selection', function(event) {
        if (!isShiftPressed.current || !selectionStart) return;
        
        const [x, y] = d3.pointer(event, this);
        // Get coordinates relative to the plot area (inside margins)
        const currentPoint: [number, number] = [x - margin.left, y - margin.top];
        
        setSelectionState(prev => ({
          ...prev,
          endX: currentPoint[0],
          endY: currentPoint[1],
        }));
      });
      
      svg.on('mouseup.selection', function(event) {
        if (!isShiftPressed.current || !selectionStart) return;
        
        const [x, y] = d3.pointer(event, this);
        // Get coordinates relative to the plot area (inside margins)
        const endPoint: [number, number] = [x - margin.left, y - margin.top];
        
        // Get current transform before selection
        const currentTransform = d3.zoomTransform(this);
        
        console.log('[Range Selection] End:', {
          startPoint: selectionStart,
          endPoint: endPoint,
          rawEnd: { x, y },
          currentTransform: { k: currentTransform.k, x: currentTransform.x, y: currentTransform.y }
        });
        
        // Perform zoom to selection
        handleRangeSelection(selectionStart, endPoint);
        
        // Clear selection
        selectionStart = null;
        setSelectionState({
          isSelecting: false,
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0,
        });
      });
    }

    // Set initial cursor
    svg.style('cursor', enablePan ? 'grab' : 'default');

    // Handle cursor changes during pan
    if (enablePan) {
      svg.on('mousedown.cursor', () => {
        if (!isShiftPressed.current) {
          svg.style('cursor', 'grabbing');
        }
      });
      svg.on('mouseup.cursor', () => {
        if (!isShiftPressed.current) {
          svg.style('cursor', 'grab');
        }
      });
    }

    return () => {
      svg.on('.zoom', null);
      svg.on('mousedown.cursor', null);
      svg.on('mouseup.cursor', null);
      svg.on('mousedown.selection', null);
      svg.on('mousemove.selection', null);
      svg.on('mouseup.selection', null);
      svg.on('mouseenter', null);
      svg.on('mouseleave', null);
      if (enableRangeSelection) {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, [svgRef, width, height, minZoom, maxZoom, enablePan, enableZoom, handleZoom, margin, enableRangeSelection, handleRangeSelection, onZoomStart, onZoomEnd]);

  // Load initial state from localStorage when chartId changes
  useEffect(() => {
    if (!chartId) return;
    
    const initialState = getInitialZoomState();
    if (initialState.k !== 1 || initialState.x !== 0 || initialState.y !== 0) {
      // console.log(`[useChartZoom] Setting initial state from localStorage for chart ${chartId}`);
      setZoomState(initialState);
      hasInitialized.current = true;
    }
  }, [chartId, getInitialZoomState]);

  // Apply initial zoom state from localStorage after zoom behavior is initialized
  const hasAppliedInitialZoom = useRef(false);
  
  // Reset when chartId changes
  useEffect(() => {
    hasAppliedInitialZoom.current = false;
  }, [chartId]);
  
  useEffect(() => {
    if (!svgRef.current || !zoomBehaviorRef.current || !enableZoom || !chartId) return;
    if (hasAppliedInitialZoom.current) return; // Prevent multiple applications
    
    // Apply zoom state if we have one
    if (zoomState.k !== 1 || zoomState.x !== 0 || zoomState.y !== 0) {
      // Small delay to ensure SVG and zoom behavior are ready
      const timeoutId = setTimeout(() => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        
        // console.log(`[useChartZoom] Applying zoom state for chart ${chartId}:`, zoomState);
        const svg = d3.select(svgRef.current);
        // Apply transform immediately without animation for smooth experience
        svg.call(zoomBehaviorRef.current.transform, zoomState.transform);
        hasAppliedInitialZoom.current = true;
      }, 100); // Small delay to ensure zoom behavior is ready
      
      return () => clearTimeout(timeoutId);
    }
  }, [chartId, enableZoom, zoomState, svgRef]); // Use zoomState from state

  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(300)
      .ease(d3.easeCubicInOut)
      .call(zoomBehaviorRef.current.scaleBy, 1.2);
  }, [svgRef]);

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(300)
      .ease(d3.easeCubicInOut)
      .call(zoomBehaviorRef.current.scaleBy, 0.8);
  }, [svgRef]);

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(400)
      .ease(d3.easeCubicInOut)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity
      );
    
    // Clear saved zoom state
    if (chartId) {
      try {
        localStorage.removeItem(`chart-zoom-${chartId}`);
        hasAppliedInitialZoom.current = false;
        hasInitialized.current = false;
      } catch (error) {
        console.warn('Failed to clear zoom state from localStorage:', error);
      }
    }
  }, [svgRef, chartId]);

  const setZoom = useCallback((scale: number, x = 0, y = 0) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(300)
      .ease(d3.easeCubicInOut)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(x, y).scale(scale)
      );
  }, [svgRef]);

  return {
    zoomState,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    zoomLevel: zoomState.k,
    currentTransform: zoomState.transform,
    selectionState,
  };
};