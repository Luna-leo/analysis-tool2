import React, { ReactNode, forwardRef } from 'react'

interface ChartContainerProps {
  isLoading?: boolean
  error?: Error | null
  children: ReactNode
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ isLoading, error, children, onMouseEnter, onMouseLeave }, ref) => {
    return (
      <div 
        ref={ref}
        className="w-full h-full relative overflow-hidden"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-sm text-muted-foreground">Loading data...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-sm text-destructive">Error loading data</div>
          </div>
        )}
        {children}
      </div>
    )
  }
)

ChartContainer.displayName = 'ChartContainer'