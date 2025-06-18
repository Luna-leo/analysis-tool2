import React from 'react';
import { Plus, Minus, Home, ScanSearch } from 'lucide-react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoomLevel: number;
  minZoom: number;
  maxZoom: number;
  showZoomLevel?: boolean;
  isRangeSelectionMode?: boolean;
  onToggleRangeSelection?: () => void;
  variant?: 'default' | 'compact';
  position?: 'absolute' | 'static';
  orientation?: 'vertical' | 'horizontal';
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  zoomLevel,
  minZoom,
  maxZoom,
  showZoomLevel = false,
  isRangeSelectionMode = false,
  onToggleRangeSelection,
  variant = 'default',
  position = 'absolute',
  orientation = 'vertical',
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

  const isCompact = variant === 'compact';
  const isHorizontal = orientation === 'horizontal';
  
  const containerClass = `
    ${position === 'absolute' ? 'absolute bottom-4 right-4' : ''}
    flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-0.5
    ${isCompact ? 'opacity-70 hover:opacity-100 transition-opacity' : ''}
  `.trim();
  
  const buttonSize = isCompact ? 'w-6 h-6' : 'w-8 h-8';
  const iconSize = isCompact ? 'w-3 h-3' : 'w-4 h-4';
  
  return (
    <div className={containerClass}>
      {showZoomLevel && !isCompact && (
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
          ${buttonSize} ${isHorizontal ? 'rounded-l-md' : 'rounded-t-md'} bg-white/90 backdrop-blur-sm border border-gray-200/50
          flex items-center justify-center transition-all duration-100
          ${canZoomIn 
            ? 'hover:bg-white hover:shadow-md active:scale-95 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed'
          }
          shadow-sm
        `}
        aria-label="Zoom in"
        title="ズームイン"
      >
        <Plus className={`${iconSize} text-gray-700`} />
      </button>
      
      <button
        onClick={onReset}
        className={`
          ${buttonSize} bg-white/90 backdrop-blur-sm border border-gray-200/50 ${isHorizontal ? 'border-l-0 border-r-0' : 'border-t-0 border-b-0'}
          flex items-center justify-center transition-all duration-100
          hover:bg-white hover:shadow-md active:scale-95 cursor-pointer
          shadow-sm
        `}
        aria-label="Reset zoom"
        title="リセット"
      >
        <Home className={`${iconSize} text-gray-700`} />
      </button>
      
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className={`
          ${buttonSize} ${!onToggleRangeSelection ? (isHorizontal ? '' : 'rounded-b-md') : ''} bg-white/90 backdrop-blur-sm border border-gray-200/50 ${isHorizontal && !isCompact ? 'border-l-0' : ''} ${isHorizontal && isCompact ? 'border-l-0' : ''}
          flex items-center justify-center transition-all duration-100
          ${canZoomOut 
            ? 'hover:bg-white hover:shadow-md active:scale-95 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed'
          }
          shadow-sm
        `}
        aria-label="Zoom out"
        title="ズームアウト"
      >
        <Minus className={`${iconSize} text-gray-700`} />
      </button>
      
      {onToggleRangeSelection && (
        <button
          onClick={onToggleRangeSelection}
          className={`
            ${buttonSize} ${isHorizontal ? 'rounded-r-md border-l-0' : 'rounded-b-md border-t-0'} bg-white/90 backdrop-blur-sm border border-gray-200/50
            flex items-center justify-center transition-all duration-100
            hover:bg-white hover:shadow-md active:scale-95 cursor-pointer
            shadow-sm
            ${isRangeSelectionMode ? 'bg-blue-50 hover:bg-blue-100' : ''}
          `}
          aria-label="Toggle range selection mode"
          title="範囲選択ズーム (Shift+ドラッグ)"
        >
          <ScanSearch className={`${iconSize} ${isRangeSelectionMode ? 'text-blue-600' : 'text-gray-700'}`} />
        </button>
      )}
    </div>
  );
};