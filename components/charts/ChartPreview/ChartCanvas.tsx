import React, { forwardRef } from 'react'

interface ChartCanvasProps {
  width: number
  height: number
  isLoading?: boolean
  chartId: string
}

export const ChartCanvas = forwardRef<SVGSVGElement, ChartCanvasProps>(
  ({ width, height, isLoading, chartId }, ref) => {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <svg 
          ref={ref}
          width={width} 
          height={height} 
          className="absolute inset-0" 
          style={{ 
            visibility: isLoading ? 'hidden' : 'visible',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
          data-chart-id={chartId}
        />
      </div>
    )
  }
)

ChartCanvas.displayName = 'ChartCanvas'