import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ChartSkeletonProps {
  isCompactLayout?: boolean
  cardMinHeight?: number
  chartMinHeight?: number
  className?: string
}

export const ChartSkeleton = React.memo(function ChartSkeleton({
  isCompactLayout = false,
  cardMinHeight = 180,
  chartMinHeight = 80,
  className
}: ChartSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-card border rounded-lg flex flex-col relative overflow-hidden",
        isCompactLayout ? "p-3" : "p-4",
        className
      )}
      style={{
        minHeight: `${cardMinHeight}px`,
      }}
    >
      {/* Title skeleton */}
      <div className="mb-3">
        <Skeleton className="h-5 w-3/4" />
      </div>
      
      {/* Chart area skeleton */}
      <div 
        className="flex-1 relative"
        style={{
          minHeight: `${chartMinHeight}px`,
        }}
      >
        {/* Axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-8">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
        </div>
        
        <div className="absolute top-0 bottom-0 left-0 flex flex-col justify-between py-8">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-6" />
        </div>
        
        {/* Chart lines skeleton */}
        <div className="absolute inset-0 p-8">
          <svg className="w-full h-full">
            {/* Grid lines */}
            <line x1="0" y1="25%" x2="100%" y2="25%" stroke="currentColor" strokeOpacity="0.1" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeOpacity="0.1" />
            <line x1="0" y1="75%" x2="100%" y2="75%" stroke="currentColor" strokeOpacity="0.1" />
            
            <line x1="25%" y1="0" x2="25%" y2="100%" stroke="currentColor" strokeOpacity="0.1" />
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeOpacity="0.1" />
            <line x1="75%" y1="0" x2="75%" y2="100%" stroke="currentColor" strokeOpacity="0.1" />
            
            {/* Animated chart line */}
            <path
              d="M 0 60 Q 25 40, 50 50 T 100 30"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="2"
              className="animate-pulse"
            />
          </svg>
        </div>
      </div>
      
      {/* Legend skeleton */}
      {!isCompactLayout && (
        <div className="mt-3 flex gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      )}
    </div>
  )
})