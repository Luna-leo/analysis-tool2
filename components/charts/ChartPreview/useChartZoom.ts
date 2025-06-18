import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface UseChartZoomProps {
  svgRef: React.RefObject<SVGSVGElement>;
  width: number;
  height: number;
  minZoom?: number;
  maxZoom?: number;
  enablePan?: boolean;
  enableZoom?: boolean;
  onZoom?: (transform: d3.ZoomTransform) => void;
  margin?: { top: number; right: number; bottom: number; left: number };
}

interface ZoomState {
  k: number;
  x: number;
  y: number;
  transform: d3.ZoomTransform;
}

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
}: UseChartZoomProps) => {
  const [zoomState, setZoomState] = useState<ZoomState>({ 
    k: 1, 
    x: 0, 
    y: 0,
    transform: d3.zoomIdentity 
  });
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();

  const handleZoom = useCallback((event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
    const { transform } = event;
    setZoomState({ 
      k: transform.k, 
      x: transform.x, 
      y: transform.y,
      transform 
    });
    
    // Call external zoom handler if provided
    if (onZoom) {
      onZoom(transform);
    }
  }, [onZoom]);

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
  }, [svgRef, width, height, minZoom, maxZoom, enablePan, enableZoom, handleZoom]);

  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 1.2);
  }, [svgRef]);

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 0.8);
  }, [svgRef]);

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      zoomBehaviorRef.current.transform,
      d3.zoomIdentity
    );
  }, [svgRef]);

  const setZoom = useCallback((scale: number, x = 0, y = 0) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(200).call(
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