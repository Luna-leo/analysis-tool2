"use client"

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MasterItem } from './types'

interface MasterPageCardGridProps<T extends MasterItem> {
  items: T[]
  cardRenderer: (item: T) => React.ReactNode
  columns?: 1 | 2 | 3 | 4
  emptyState?: React.ReactNode
}

export function MasterPageCardGrid<T extends MasterItem>({
  items,
  cardRenderer,
  columns = 2,
  emptyState
}: MasterPageCardGridProps<T>) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  if (items.length === 0 && emptyState) {
    return (
      <div className="flex items-center justify-center h-full">
        {emptyState}
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className={`grid ${gridCols[columns]} gap-4 p-1`}>
        {items.map((item) => (
          <div key={item.id} className="transition-all duration-200">
            {cardRenderer(item)}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}