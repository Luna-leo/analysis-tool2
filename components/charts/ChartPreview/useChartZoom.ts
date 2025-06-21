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
  isRangeSelectionMode?: boolean;
  getScales?: () => {
    baseScales: {
      xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null;
      yScale: d3.ScaleLinear<number, number> | null;
    };
    currentScales: {
      xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null;
      yScale: d3.ScaleLinear<number, number> | null;
    };
  };
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
  isRangeSelectionMode = false,
  getScales,
}: UseChartZoomProps) => {
  // Load initial state from localStorage
  const getInitialZoomState = useCallback((): ZoomState => {
    if (!chartId) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useChartZoom] getInitialZoomState: No chartId provided`);
      }
      return { k: 1, x: 0, y: 0, transform: d3.zoomIdentity };
    }
    
    try {
      const key = `chart-zoom-${chartId}`;
      const savedState = localStorage.getItem(key);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useChartZoom] Checking localStorage for key: ${key}`, {
          found: !!savedState,
          value: savedState
        });
      }
      
      if (savedState) {
        const parsed = JSON.parse(savedState);
        const transform = d3.zoomIdentity
          .translate(parsed.x || 0, parsed.y || 0)
          .scale(parsed.k || 1);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[useChartZoom] Loaded zoom state for chart ${chartId}:`, parsed);
        }
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useChartZoom] No saved zoom state found for chart ${chartId}, using default`);
    }
    
    return { k: 1, x: 0, y: 0, transform: d3.zoomIdentity };
  }, [chartId]);

  const [zoomState, setZoomState] = useState<ZoomState>(getInitialZoomState);
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
  const isProgrammaticZoom = useRef(false);
  
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
        if (process.env.NODE_ENV === 'development') {
          console.log(`[useChartZoom] Saved zoom state for chart ${chartId}:`, data);
        }
      } catch (error) {
        console.warn('Failed to save zoom state to localStorage:', error);
      }
    }, 100),
    [chartId]
  );

  const handleZoom = useCallback((event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
    // Skip if this is a programmatic zoom from storage sync
    if (isProgrammaticZoom.current) {
      return;
    }
    
    const { transform } = event;
    const newState = { 
      k: transform.k, 
      x: transform.x, 
      y: transform.y,
      transform 
    };
    
    // Only log significant zoom events
    if (event.sourceEvent && process.env.NODE_ENV === 'development') {
      console.log(`[Zoom ${chartId}] Transform updated:`, {
        k: transform.k.toFixed(2),
        sourceEvent: event.sourceEvent.type
      });
    }
    
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
    
    // Calculate the bounding box of the selection (in SVG coordinates)
    const x0 = Math.min(startPoint[0], endPoint[0]);
    const x1 = Math.max(startPoint[0], endPoint[0]);
    const y0 = Math.min(startPoint[1], endPoint[1]);
    const y1 = Math.max(startPoint[1], endPoint[1]);
    
    // Selection size in SVG coordinates
    const selectionWidth = x1 - x0;
    const selectionHeight = y1 - y0;
    
    // Only process if selection is large enough
    if (selectionWidth < 10 || selectionHeight < 10) {
      return;
    }
    
    // Get scales if available
    const scales = getScales?.();
    const baseScales = scales?.baseScales;
    const currentScales = scales?.currentScales;
    
    // Debug log to check scale availability
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Range Selection ${chartId}] Scale check:`, {
        hasGetScales: !!getScales,
        hasBaseScales: !!baseScales?.xScale && !!baseScales?.yScale,
        hasCurrentScales: !!currentScales?.xScale && !!currentScales?.yScale,
        baseScalesDomain: baseScales?.xScale ? baseScales.xScale.domain() : 'null',
        currentScalesDomain: currentScales?.xScale ? currentScales.xScale.domain() : 'null'
      });
    }
    
    // Use simple pixel-based approach similar to test-zoom/debug-page.tsx
    // Work in SVG coordinates throughout
    
    // Calculate scale to fit selection in viewport (with some padding)
    const scaleX = width / selectionWidth;
    const scaleY = height / selectionHeight;
    const newScale = Math.min(scaleX, scaleY, maxZoom) * 0.9; // 90% to add padding
    
    // Calculate center of selection in SVG coordinates
    const centerX = (x0 + x1) / 2;
    const centerY = (y0 + y1) / 2;
    
    // Calculate translation to center the selection in the SVG viewport
    const translateX = width / 2 - centerX * newScale;
    const translateY = height / 2 - centerY * newScale;
    
    // Debug log
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Range Selection ${chartId}] Transform calculation:`, {
        selection: { x0, y0, x1, y1, width: selectionWidth, height: selectionHeight },
        svgSize: { width, height },
        center: { x: centerX, y: centerY },
        scale: { scaleX, scaleY, final: newScale },
        translate: { x: translateX, y: translateY }
      });
    }
    
    // Create and apply the transform
    const transform = d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(newScale);
    
    // Apply transform with smooth transition
    svg.transition()
      .duration(400)
      .ease(d3.easeCubicInOut)
      .call(zoomBehaviorRef.current.transform, transform);
  }, [width, height, maxZoom, svgRef, getScales, chartId]);

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
          // Hide all tooltips when entering range selection mode
          import('@/utils/chart/chartTooltipManager').then(({ ChartTooltipManager }) => {
            ChartTooltipManager.cleanup();
          });
        }
      } else if (event.key === 'Escape') {
        // Cancel any active selection
        setSelectionState({
          isSelecting: false,
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0,
        });
        // Reset cursor
        svg.style('cursor', isRangeSelectionMode && enableRangeSelection ? 'crosshair' : (enablePan ? 'grab' : 'default'));
      }
    };
    
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        isShiftPressed.current = false;
        svg.style('cursor', isRangeSelectionMode && enableRangeSelection ? 'crosshair' : (enablePan ? 'grab' : 'default'));
        // Don't clear selection state if we're actively selecting
        // The selection will be cleared in mouseup handler
      }
    };

    // Track mouse enter/leave for this specific SVG
    if (enableRangeSelection) {
      svg.on('mouseenter', function(event: MouseEvent) {
        isMouseOverSvg = true;
        // Check if shift is already pressed or range selection mode is active
        if (event.shiftKey || isRangeSelectionMode) {
          if (event.shiftKey) {
            isShiftPressed.current = true;
          }
          svg.style('cursor', 'crosshair');
          // Hide all tooltips when entering with shift pressed or in range selection mode
          import('@/utils/chart/chartTooltipManager').then(({ ChartTooltipManager }) => {
            ChartTooltipManager.cleanup();
          });
        }
      });
      
      svg.on('mouseleave', () => {
        isMouseOverSvg = false;
        isShiftPressed.current = false;
        svg.style('cursor', isRangeSelectionMode && enableRangeSelection ? 'crosshair' : (enablePan ? 'grab' : 'default'));
        // Clear selection if leaving while selecting
        // This is intentional - we cancel selection if mouse leaves the chart area
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
        // Debug logging for event filtering
        if (process.env.NODE_ENV === 'development' && event.type === 'dblclick') {
          console.log(`[useChartZoom] Double-click event in zoom filter for chart ${chartId}`);
        }
        
        // Disable double-click zoom (we handle it separately)
        if (event.type === 'dblclick') return false;
        
        // If shift is pressed or range selection mode is active, don't process ANY zoom/pan events
        if ((isShiftPressed.current || isRangeSelectionMode) && enableRangeSelection) {
          // This includes mousedown, mousemove, and mouseup
          return false;
        }
        // Allow zoom on wheel events and drag
        return !event.button && !event.ctrlKey;
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

    // Debug: Log that we're setting up double-click handler
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useChartZoom] Setting up double-click handler for chart ${chartId}`);
    }

    // Handle double-click for reset
    svg.on('dblclick.reset', (event) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useChartZoom] Double-click reset triggered for chart ${chartId}`);
      }
      // Prevent default zoom behavior
      event.preventDefault();
      event.stopPropagation();
      
      // Reset the zoom state immediately
      const identityState = {
        k: 1,
        x: 0,
        y: 0,
        transform: d3.zoomIdentity
      };
      setZoomState(identityState);
      
      // Apply the transform to SVG
      svg.transition()
        .duration(400)
        .ease(d3.easeCubicInOut)
        .call(
          zoomBehaviorRef.current.transform,
          d3.zoomIdentity
        );
      
      // Save the reset state
      if (chartId) {
        saveZoomState(identityState);
        hasAppliedInitialZoom.current = false;
        hasInitialized.current = false;
      }
    });

    // Handle range selection if enabled
    if (enableRangeSelection) {
      let selectionStart: [number, number] | null = null;
      
      svg.on('mousedown.selection', function(event) {
        if (!isShiftPressed.current && !isRangeSelectionMode) return;
        
        // Hide all tooltips when starting selection
        import('@/utils/chart/chartTooltipManager').then(({ ChartTooltipManager }) => {
          ChartTooltipManager.cleanup();
        });
        
        const [x, y] = d3.pointer(event, this);
        // Keep coordinates in SVG space
        selectionStart = [x, y];
        
        setSelectionState({
          isSelecting: true,
          startX: selectionStart[0],
          startY: selectionStart[1],
          endX: selectionStart[0],
          endY: selectionStart[1],
        });
        
        event.preventDefault();
        event.stopPropagation();
      });
      
      svg.on('mousemove.selection', function(event) {
        // Continue tracking if we have an active selection (even if shift is released)
        if (!selectionStart) return;
        
        const [x, y] = d3.pointer(event, this);
        // Keep coordinates in SVG space
        const currentPoint: [number, number] = [x, y];
        
        setSelectionState(prev => ({
          ...prev,
          endX: currentPoint[0],
          endY: currentPoint[1],
        }));
      });
      
      svg.on('mouseup.selection', function(event) {
        // Check if we have an active selection (regardless of current shift state)
        if (!selectionStart) return;
        
        const [x, y] = d3.pointer(event, this);
        // Keep coordinates in SVG space
        const endPoint: [number, number] = [x, y];
        
        // Get current transform before selection
        const currentTransform = d3.zoomTransform(this);
        
        // Log only in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Range Selection ${chartId}] Completed:`, {
            width: Math.abs(endPoint[0] - selectionStart[0]).toFixed(0),
            height: Math.abs(endPoint[1] - selectionStart[1]).toFixed(0)
          });
        }
        
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
        
        event.preventDefault();
        event.stopPropagation();
      });
    }

    // Set initial cursor
    svg.style('cursor', isRangeSelectionMode && enableRangeSelection ? 'crosshair' : (enablePan ? 'grab' : 'default'));

    // Handle cursor changes during pan (use non-conflicting namespace)
    if (enablePan) {
      svg.on('mousedown.cursor', function(event) {
        if (!isShiftPressed.current && !isRangeSelectionMode) {
          svg.style('cursor', 'grabbing');
        }
      });
      svg.on('mouseup.cursor', function(event) {
        if (!isShiftPressed.current && !isRangeSelectionMode) {
          svg.style('cursor', 'grab');
        }
      });
    }

    return () => {
      svg.on('.zoom', null);
      svg.on('dblclick.reset', null);
      svg.on('mousedown.selection', null);
      svg.on('mousemove.selection', null);
      svg.on('mouseup.selection', null);
      svg.on('mousedown.cursor', null);
      svg.on('mouseup.cursor', null);
      svg.on('mouseenter', null);
      svg.on('mouseleave', null);
      if (enableRangeSelection) {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, [svgRef, width, height, minZoom, maxZoom, enablePan, enableZoom, handleZoom, margin, enableRangeSelection, isRangeSelectionMode, handleRangeSelection, onZoomStart, onZoomEnd, chartId, saveZoomState]);

  // Handle container size changes
  const previousDimensionsRef = useRef({ width, height });
  useEffect(() => {
    if (!svgRef.current || !zoomBehaviorRef.current || !enableZoom) return;
    
    const prevWidth = previousDimensionsRef.current.width;
    const prevHeight = previousDimensionsRef.current.height;
    
    // Check if dimensions actually changed
    if (prevWidth === width && prevHeight === height) return;
    
    // If zoom is not at identity, adjust the transform
    if (zoomState.k !== 1 || zoomState.x !== 0 || zoomState.y !== 0) {
      // Calculate the center point in the previous dimensions
      const centerXRatio = (prevWidth / 2 - zoomState.x) / (prevWidth * zoomState.k);
      const centerYRatio = (prevHeight / 2 - zoomState.y) / (prevHeight * zoomState.k);
      
      // Calculate new translation to maintain the same center point
      const newX = width / 2 - centerXRatio * width * zoomState.k;
      const newY = height / 2 - centerYRatio * height * zoomState.k;
      
      // Create new transform
      const newTransform = d3.zoomIdentity
        .translate(newX, newY)
        .scale(zoomState.k);
      
      // Apply the adjusted transform
      const svg = d3.select(svgRef.current);
      svg.call(zoomBehaviorRef.current.transform, newTransform);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useChartZoom] Adjusted zoom for dimension change:`, {
          chartId,
          prevDimensions: { width: prevWidth, height: prevHeight },
          newDimensions: { width, height },
          oldTransform: { x: zoomState.x, y: zoomState.y, k: zoomState.k },
          newTransform: { x: newX, y: newY, k: zoomState.k }
        });
      }
    }
    
    // Update the previous dimensions
    previousDimensionsRef.current = { width, height };
  }, [width, height, zoomState, enableZoom, chartId]);

  // This effect is no longer needed since we initialize state with getInitialZoomState
  // Keeping it just for logging purposes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && chartId) {
      const initialState = getInitialZoomState();
      console.log(`[useChartZoom] Component mounted with chartId ${chartId}, initial state:`, {
        chartId,
        initialState,
        currentZoomState: zoomState
      });
    }
  }, [chartId]); // Removed getInitialZoomState from deps as it's stable

  // Apply initial zoom state from localStorage after zoom behavior is initialized
  const hasAppliedInitialZoom = useRef(false);
  
  // Reset when chartId changes
  useEffect(() => {
    hasAppliedInitialZoom.current = false;
  }, [chartId]);
  
  useEffect(() => {
    if (!svgRef.current || !zoomBehaviorRef.current || !enableZoom || !chartId) return;
    if (hasAppliedInitialZoom.current) return; // Prevent multiple applications
    
    // If we don't have a saved zoom state, no need to wait
    if (zoomState.k === 1 && zoomState.x === 0 && zoomState.y === 0) {
      hasAppliedInitialZoom.current = true;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useChartZoom] Skipping initial zoom application for chart ${chartId}: zoom state is default`);
      }
      return;
    }
    
    // Set up an interval to check for scales
    const checkInterval = setInterval(() => {
      const scales = getScales?.();
      const hasScales = scales?.baseScales?.xScale && scales?.baseScales?.yScale;
      
      if (hasScales && svgRef.current && zoomBehaviorRef.current) {
        // Scales are ready, apply the zoom
        if (process.env.NODE_ENV === 'development') {
          console.log(`[useChartZoom] Applying initial zoom state for chart ${chartId}:`, {
            zoomState,
            hasScales: !!hasScales
          });
        }
        
        const svg = d3.select(svgRef.current);
        // Apply transform immediately without animation for smooth experience
        svg.call(zoomBehaviorRef.current.transform, zoomState.transform);
        hasAppliedInitialZoom.current = true;
        
        // Clear the interval
        clearInterval(checkInterval);
      }
    }, 50); // Check every 50ms
    
    // Clear interval after 5 seconds to prevent infinite checking
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      hasAppliedInitialZoom.current = true; // Give up after 5 seconds
    }, 5000);
    
    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeoutId);
    };
  }, [chartId, enableZoom, zoomState, svgRef, getScales]); // Use zoomState from state

  // Listen for storage changes from other instances
  useEffect(() => {
    if (!chartId) return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `chart-zoom-${chartId}` && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          const transform = d3.zoomIdentity
            .translate(newState.x || 0, newState.y || 0)
            .scale(newState.k || 1);
          
          setZoomState({
            k: newState.k || 1,
            x: newState.x || 0,
            y: newState.y || 0,
            transform
          });
          
          // Apply the transform to the SVG if available
          if (svgRef.current && zoomBehaviorRef.current) {
            const svg = d3.select(svgRef.current);
            isProgrammaticZoom.current = true;
            svg.call(zoomBehaviorRef.current.transform, transform);
            // Reset the flag after a short delay to ensure the zoom event has been processed
            setTimeout(() => {
              isProgrammaticZoom.current = false;
            }, 0);
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[useChartZoom] Storage change detected for chart ${chartId}:`, newState);
          }
        } catch (error) {
          console.warn('Failed to parse zoom state from storage event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [chartId, svgRef]);

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
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useChartZoom] Resetting zoom for chart ${chartId}`);
    }
    
    // Reset the zoom state immediately
    const identityState = {
      k: 1,
      x: 0,
      y: 0,
      transform: d3.zoomIdentity
    };
    setZoomState(identityState);
    
    // Apply the transform to SVG
    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(400)
      .ease(d3.easeCubicInOut)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity
      );
    
    // Save the reset state instead of clearing it
    // This ensures consistency between instances
    if (chartId) {
      saveZoomState(identityState);
      hasAppliedInitialZoom.current = false;
      hasInitialized.current = false;
    }
  }, [svgRef, chartId, saveZoomState]);

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

  // Double-click handler is now set up in the main zoom setup effect

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