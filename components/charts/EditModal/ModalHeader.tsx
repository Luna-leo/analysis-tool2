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
        <div className="flex items-center gap-4">
          <DialogTitle>Edit Chart: {title}</DialogTitle>
          
          {showNavigation && (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onPreviousChart}
                disabled={currentIndex === 0}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground px-2">
                {currentIndex + 1} / {totalCharts}
              </span>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onNextChart}
                disabled={currentIndex === totalCharts - 1}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Changes</Button>
          {hasNextChart && onSaveAndNext && (
            <Button onClick={onSaveAndNext} variant="secondary">
              Save & Next
            </Button>
          )}
        </div>
      </div>
    </DialogHeader>
  )
}