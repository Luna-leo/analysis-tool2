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
    
    // Calculate the bounding box of the selection (in plot area coordinates)
    const x0 = Math.min(startPoint[0], endPoint[0]);
    const x1 = Math.max(startPoint[0], endPoint[0]);
    const y0 = Math.min(startPoint[1], endPoint[1]);
    const y1 = Math.max(startPoint[1], endPoint[1]);
    
    // Selection size in plot area coordinates
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
    
    // If scales are provided, use data-coordinate based zoom
    if (baseScales?.xScale && baseScales?.yScale) {
      // Use current scales if available, otherwise use base scales
      const activeXScale = currentScales?.xScale || baseScales.xScale;
      const activeYScale = currentScales?.yScale || baseScales.yScale;
      
      // Use active scales to convert mouse coordinates to data coordinates
      // Mouse coordinates are in plot area coordinates
      const dataX0 = activeXScale.invert(x0);
      const dataX1 = activeXScale.invert(x1);
      const dataY0 = activeYScale.invert(y1); // SVG Y is inverted
      const dataY1 = activeYScale.invert(y0);
      
      // Get the original (unzoomed) data domain from base scales
      const originalXDomain = baseScales.xScale.domain();
      const originalYDomain = baseScales.yScale.domain();
      
      // Calculate the scale needed to fit the selected data range in the viewport
      const xDomainSpan = originalXDomain[1].valueOf() - originalXDomain[0].valueOf();
      const yDomainSpan = originalYDomain[1] - originalYDomain[0];
      const selectedXSpan = dataX1.valueOf() - dataX0.valueOf();
      const selectedYSpan = dataY1 - dataY0;
      
      const scaleX = xDomainSpan / selectedXSpan;
      const scaleY = yDomainSpan / selectedYSpan;
      const newScale = Math.min(scaleX, scaleY, maxZoom) * 0.9; // 90% to add padding
      
      // Calculate the center of the selected data range
      const dataCenterX = (dataX0.valueOf() + dataX1.valueOf()) / 2;
      const dataCenterY = (dataY0 + dataY1) / 2;
      
      // Convert data center to pixel coordinates using base scales
      const pixelCenterX = baseScales.xScale(dataCenterX);
      const pixelCenterY = baseScales.yScale(dataCenterY);
      
      // Calculate translation to center the selection
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;
      const translateX = plotWidth / 2 - pixelCenterX * newScale + margin.left;
      const translateY = plotHeight / 2 - pixelCenterY * newScale + margin.top;
      
      // Log only in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Range Selection ${chartId}] Data-based zoom:`, {
          pixelCoords: { x0, y0, x1, y1 },
          dataCoords: { 
            x: [dataX0, dataX1], 
            y: [dataY0, dataY1] 
          },
          originalDomain: {
            x: originalXDomain,
            y: originalYDomain
          },
          selectedSpan: { x: selectedXSpan, y: selectedYSpan },
          currentTransform: { k: currentTransform.k, x: currentTransform.x, y: currentTransform.y },
          newScale: newScale.toFixed(2),
          dataCenter: { x: dataCenterX, y: dataCenterY },
          pixelCenter: { x: pixelCenterX.toFixed(0), y: pixelCenterY.toFixed(0) },
          translate: { x: translateX.toFixed(0), y: translateY.toFixed(0) },
          plotSize: { width: plotWidth, height: plotHeight }
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
    } else {
      // Fallback to original pixel-based logic
      // Convert plot area coordinates to SVG coordinates
      const svgX0 = x0 + margin.left;
      const svgX1 = x1 + margin.left;
      const svgY0 = y0 + margin.top;
      const svgY1 = y1 + margin.top;
      
      // Calculate the center of selection in SVG coordinates
      const svgCenterX = (svgX0 + svgX1) / 2;
      const svgCenterY = (svgY0 + svgY1) / 2;
      
      // Convert to original (unzoomed) SVG coordinates
      const originalCenterX = (svgCenterX - currentTransform.x) / currentTransform.k;
      const originalCenterY = (svgCenterY - currentTransform.y) / currentTransform.k;
      
      // Calculate the selection size in original coordinates
      const originalSelectionWidth = selectionWidth / currentTransform.k;
      const originalSelectionHeight = selectionHeight / currentTransform.k;
      
      // Calculate the plot area size
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;
      
      // Calculate scale to fit selection in plot area (with some padding)
      const scaleX = plotWidth / originalSelectionWidth;
      const scaleY = plotHeight / originalSelectionHeight;
      const newScale = Math.min(scaleX, scaleY, maxZoom) * 0.9; // 90% to add padding
      
      // Calculate translation to center the selection in the SVG viewport
      const svgWidth = width;
      const svgHeight = height;
      const translateX = svgWidth / 2 - originalCenterX * newScale;
      const translateY = svgHeight / 2 - originalCenterY * newScale;
      
      // Create and apply the transform
      const transform = d3.zoomIdentity
        .translate(translateX, translateY)
        .scale(newScale);
      
      // Apply transform with smooth transition
      svg.transition()
        .duration(400)
        .ease(d3.easeCubicInOut)
        .call(zoomBehaviorRef.current.transform, transform);
    }
  }, [width, height, margin, maxZoom, svgRef, getScales, chartId]);

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
        
        // If shift is pressed or range selection mode is active, don't process normal zoom/pan
        if ((isShiftPressed.current || isRangeSelectionMode) && enableRangeSelection) {
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
        // Get coordinates relative to the plot area (inside margins)
        selectionStart = [x - margin.left, y - margin.top];
        
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
        // Get coordinates relative to the plot area (inside margins)
        const currentPoint: [number, number] = [x - margin.left, y - margin.top];
        
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
        // Get coordinates relative to the plot area (inside margins)
        const endPoint: [number, number] = [x - margin.left, y - margin.top];
        
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

    // Handle double-click for reset
    // We'll set this up after resetZoom is defined

    // Handle cursor changes during pan
    if (enablePan) {
      svg.on('mousedown.cursor', () => {
        if (!isShiftPressed.current && !isRangeSelectionMode) {
          svg.style('cursor', 'grabbing');
        }
      });
      svg.on('mouseup.cursor', () => {
        if (!isShiftPressed.current && !isRangeSelectionMode) {
          svg.style('cursor', isRangeSelectionMode && enableRangeSelection ? 'crosshair' : 'grab');
        }
      });
    }

    return () => {
      svg.on('.zoom', null);
      svg.on('dblclick.reset', null);
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
  }, [svgRef, width, height, minZoom, maxZoom, enablePan, enableZoom, handleZoom, margin, enableRangeSelection, isRangeSelectionMode, handleRangeSelection, onZoomStart, onZoomEnd, chartId, saveZoomState]);

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
            svg.call(zoomBehaviorRef.current.transform, transform);
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