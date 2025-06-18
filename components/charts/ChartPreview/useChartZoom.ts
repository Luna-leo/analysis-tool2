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
  margin?: { top: number; right: number; bottom: number; left: number };
  chartId?: string;
}

interface ZoomState {
  k: number;
  x: number;
  y: number;
  transform: d3.ZoomTransform;
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
  margin = { top: 20, right: 40, bottom: 60, left: 60 },
  chartId,
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
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  const hasInitialized = useRef(false);
  
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
    
    setZoomState(newState);
    saveZoomState(newState);
    
    // Call external zoom handler if provided
    if (onZoom) {
      onZoom(transform);
    }
  }, [onZoom, saveZoomState]);

  useEffect(() => {
    if (!svgRef.current || !enableZoom) return;

    const svg = d3.select(svgRef.current);
    
    // Clear any existing zoom behavior
    svg.on('.zoom', null);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([minZoom, maxZoom])
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
      .translateExtent([[-Infinity, -Infinity], [Infinity, Infinity]])
      .filter((event) => {
        // Allow zoom on wheel events and drag, but not on double-click
        return !event.button && !event.ctrlKey && !event.type.includes('dblclick');
      })
      .on('zoom', handleZoom);

    zoomBehaviorRef.current = zoom;

    // Apply zoom behavior
    svg.call(zoom);

    // Set initial cursor
    svg.style('cursor', enablePan ? 'grab' : 'default');

    // Handle cursor changes during pan
    if (enablePan) {
      svg.on('mousedown.cursor', () => svg.style('cursor', 'grabbing'));
      svg.on('mouseup.cursor', () => svg.style('cursor', 'grab'));
    }

    return () => {
      svg.on('.zoom', null);
      svg.on('mousedown.cursor', null);
      svg.on('mouseup.cursor', null);
    };
  }, [svgRef, width, height, minZoom, maxZoom, enablePan, enableZoom, handleZoom, margin]);

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
  };
};