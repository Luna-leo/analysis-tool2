import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  progress: number
  className?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'gradient'
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  className,
  showPercentage = true,
  size = 'md',
  variant = 'default'
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress))
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }
  
  const bgClasses = {
    default: 'bg-primary',
    gradient: 'bg-gradient-to-r from-blue-500 to-blue-600'
  }
  
  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'w-full bg-muted rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            bgClasses[variant]
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="absolute -top-6 right-0 text-xs text-muted-foreground">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  )
}

interface CircularProgressProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  showPercentage?: boolean
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 40,
  strokeWidth = 4,
  className,
  showPercentage = true
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference
  
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-primary transition-all duration-300 ease-out"
          strokeLinecap="round"
        />
      </svg>
      {showPercentage && (
        <div className="absolute text-xs font-medium">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  )
}