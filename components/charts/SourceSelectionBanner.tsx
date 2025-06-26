"use client"

import React, { useEffect } from "react"
import { X, MousePointer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/useUIStore"
import { cn } from "@/lib/utils"

export function SourceSelectionBanner() {
  const { sourceSelectionMode, cancelSourceSelection } = useUIStore()
  
  // Handle Escape key
  useEffect(() => {
    if (!sourceSelectionMode) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cancelSourceSelection()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sourceSelectionMode, cancelSourceSelection])
  
  if (!sourceSelectionMode) return null
  
  return (
    <div className={cn(
      "fixed top-20 right-6 z-50",
      "bg-blue-500 text-white rounded-lg shadow-lg px-6 py-3",
      "flex items-center gap-4 transition-all duration-200",
      "animate-in slide-in-from-top-4 slide-in-from-right-2 fade-in"
    )}>
      <div className="flex items-center gap-3">
        <MousePointer className="h-5 w-5 animate-pulse" />
        <div>
          <p className="font-medium">Select a source chart to copy settings from</p>
          <p className="text-sm opacity-90">Click on any unselected chart • Press Esc to cancel</p>
        </div>
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={cancelSourceSelection}
        className="text-white hover:bg-white/20 -mr-2"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}