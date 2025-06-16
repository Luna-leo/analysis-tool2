"use client"

import React from "react"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ModalHeaderProps {
  title: string
  onCancel: () => void
  onSave: () => void
  currentIndex?: number
  totalCharts?: number
  onPreviousChart?: () => void
  onNextChart?: () => void
  onSaveAndNext?: () => void
}

export function ModalHeader({ 
  title, 
  onCancel, 
  onSave,
  currentIndex,
  totalCharts,
  onPreviousChart,
  onNextChart,
  onSaveAndNext
}: ModalHeaderProps) {
  const showNavigation = currentIndex !== undefined && totalCharts !== undefined && totalCharts > 1
  const hasNextChart = showNavigation && currentIndex < totalCharts - 1

  return (
    <DialogHeader className="flex-shrink-0">
      <div className="flex justify-between items-center">
        <DialogTitle className="truncate pr-4" title={title}>
          Edit Chart: {title}
        </DialogTitle>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Navigation controls (fixed position) */}
          {showNavigation && (
            <>
              <div className="flex items-center gap-1 pr-2 border-r">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onPreviousChart}
                  disabled={currentIndex === 0}
                  className="h-8 w-8 p-0"
                  title="Previous chart (Ctrl+←)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="px-2 py-1 text-sm font-medium min-w-[60px] text-center">
                  {currentIndex + 1} / {totalCharts}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onNextChart}
                  disabled={currentIndex === totalCharts - 1}
                  className="h-8 w-8 p-0"
                  title="Next chart (Ctrl+→)"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
          
          {/* Action buttons */}
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {hasNextChart && onSaveAndNext && (
            <Button onClick={onSaveAndNext} variant="secondary">
              Save & Next
            </Button>
          )}
          <Button onClick={onSave}>{hasNextChart ? 'Save & Close' : 'Save Changes'}</Button>
        </div>
      </div>
    </DialogHeader>
  )
}