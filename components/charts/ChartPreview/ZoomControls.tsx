import React from 'react';
import { Plus, Minus, Home } from 'lucide-react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoomLevel: number;
  minZoom: number;
  maxZoom: number;
  showZoomLevel?: boolean;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  zoomLevel,
  minZoom,
  maxZoom,
  showZoomLevel = false,
}) => {
  const canZoomIn = zoomLevel < maxZoom;
  const canZoomOut = zoomLevel > minZoom;
  const zoomPercentage = Math.round(zoomLevel * 100);
  const [isHighlighted, setIsHighlighted] = React.useState(false);
  const hasHighlightedRef = React.useRef(false);
  
  // Highlight zoom level only on initial restoration from localStorage
  React.useEffect(() => {
    if (zoomLevel !== 1 && !hasHighlightedRef.current) {
      hasHighlightedRef.current = true;
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [zoomLevel]);

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-0.5">
      {showZoomLevel && (
        <div 
          className={`
            mb-2 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-center shadow-sm border
            transition-all duration-500
            ${
              isHighlighted 
                ? 'bg-blue-50 border-blue-300 text-blue-700 scale-110 shadow-md' 
                : 'border-gray-200/50 text-gray-600'
            }
          `}
        >
          {zoomPercentage}%
        </div>
      )}
      
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className={`
          w-8 h-8 rounded-t-md bg-white/90 backdrop-blur-sm border border-gray-200/50
          flex items-center justify-center transition-all duration-100
          ${canZoomIn 
            ? 'hover:bg-white hover:shadow-md active:scale-95 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed'
          }
          shadow-sm
        `}
        aria-label="Zoom in"
      >
        <Plus className="w-4 h-4 text-gray-700" />
      </button>
      
      <button
        onClick={onReset}
        className="
          w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-200/50 border-t-0 border-b-0
          flex items-center justify-center transition-all duration-100
          hover:bg-white hover:shadow-md active:scale-95 cursor-pointer
          shadow-sm
        "
        aria-label="Reset zoom"
      >
        <Home className="w-4 h-4 text-gray-700" />
      </button>
      
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className={`
          w-8 h-8 rounded-b-md bg-white/90 backdrop-blur-sm border border-gray-200/50
          flex items-center justify-center transition-all duration-100
          ${canZoomOut 
            ? 'hover:bg-white hover:shadow-md active:scale-95 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed'
          }
          shadow-sm
        `}
        aria-label="Zoom out"
      >
        <Minus className="w-4 h-4 text-gray-700" />
      </button>
    </div>
  );
};