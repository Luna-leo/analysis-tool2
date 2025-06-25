import React from 'react'
import { ZoomControls } from './ZoomControls'

interface ChartOverlayProps {
  enableZoom?: boolean
  showZoomControls?: boolean
  isMouseOver?: boolean
  isCompactLayout?: boolean
  chartSettings?: any
  zoomLevel: number
  isRangeSelectionMode?: boolean
  isShiftPressed?: boolean
  qualityState?: {
    isTransitioning: boolean
    level: string
  }
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onToggleRangeSelection: () => void
}

export const ChartOverlay: React.FC<ChartOverlayProps> = ({
  enableZoom,
  showZoomControls,
  isMouseOver,
  isCompactLayout,
  chartSettings,
  zoomLevel,
  isRangeSelectionMode,
  isShiftPressed,
  qualityState,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleRangeSelection
}) => {
  if (!enableZoom || !showZoomControls) return null
  
  return (
    <>
      {/* Zoom controls */}
      {chartSettings ? (
        // Compact mode for ChartCard - show on hover
        <div 
          className={`absolute z-10 transition-opacity duration-200 ${isMouseOver ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ 
            bottom: '4px', 
            right: '8px' 
          }}
        >
          <ZoomControls
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onReset={onResetZoom}
            zoomLevel={zoomLevel}
            minZoom={0.5}
            maxZoom={10}
            showZoomLevel={false}
            isRangeSelectionMode={isRangeSelectionMode}
            onToggleRangeSelection={onToggleRangeSelection}
            variant={isCompactLayout ? "ultra-compact" : "default"}
            position="static"
            orientation="horizontal"
          />
        </div>
      ) : (
        // Default mode for ChartEditModal - position above x-axis
        <div 
          className="absolute z-10"
          style={{ 
            bottom: '8px', 
            right: '16px' 
          }}
        >
          <ZoomControls
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onReset={onResetZoom}
            zoomLevel={zoomLevel}
            minZoom={0.5}
            maxZoom={10}
            showZoomLevel={true}
            isRangeSelectionMode={isRangeSelectionMode}
            onToggleRangeSelection={onToggleRangeSelection}
            variant="default"
            position="static"
            orientation="horizontal"
          />
        </div>
      )}
      
      {/* Range selection mode indicator */}
      {(isShiftPressed || isRangeSelectionMode) && (
        <div className={`absolute ${chartSettings ? 'top-1' : 'top-4'} left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md backdrop-blur-sm`}>
          {isRangeSelectionMode ? '範囲選択モード - ドラッグで範囲を選択' : 'Range selection mode - Drag to select area'}
        </div>
      )}
      
      {/* Performance mode indicator */}
      {qualityState?.isTransitioning && qualityState.level !== 'high' && !chartSettings && (
        <div className="absolute bottom-20 right-4 bg-yellow-500/90 text-white px-2 py-1 rounded text-xs font-medium shadow-sm backdrop-blur-sm">
          Performance mode
        </div>
      )}
    </>
  )
}