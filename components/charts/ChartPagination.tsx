"use client"

import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChartPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export const ChartPagination = React.memo(function ChartPagination({
  currentPage,
  totalPages,
  onPageChange,
  className
}: ChartPaginationProps) {
  const canGoPrevious = currentPage > 0
  const canGoNext = currentPage < totalPages - 1

  const handlePreviousClick = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextClick = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageClick = (page: number) => {
    onPageChange(page)
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7 // Maximum number of page buttons to show
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 0; i < totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first, last, current and nearby pages with ellipsis
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 0; i < 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages - 1)
      } else if (currentPage >= totalPages - 4) {
        // Near the end
        pages.push(0)
        pages.push('...')
        for (let i = totalPages - 5; i < totalPages; i++) {
          pages.push(i)
        }
      } else {
        // In the middle
        pages.push(0)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages - 1)
      }
    }
    
    return pages
  }

  if (totalPages <= 1) {
    return null // Don't show pagination for single page
  }

  return (
    <div className={cn("flex items-center justify-center gap-2 p-4", className)}>
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousClick}
        disabled={!canGoPrevious}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            )
          }
          
          const pageNumber = page as number
          const isActive = pageNumber === currentPage
          
          return (
            <Button
              key={pageNumber}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageClick(pageNumber)}
              className={cn(
                "h-8 min-w-[32px] px-2",
                isActive && "pointer-events-none"
              )}
            >
              {pageNumber + 1}
            </Button>
          )
        })}
      </div>

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextClick}
        disabled={!canGoNext}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Page info */}
      <div className="ml-4 text-sm text-muted-foreground">
        Page {currentPage + 1} of {totalPages}
      </div>
    </div>
  )
})