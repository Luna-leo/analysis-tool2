"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Edit, Trash2, Plus } from 'lucide-react'
import { MasterItem, ColumnConfig } from './types'
import { useColumnResize } from './useColumnResize'

interface MasterPageVirtualTableProps<T extends MasterItem> {
  items: T[]
  columns: ColumnConfig<T>[]
  onEdit: (item: T) => void
  onDelete: (item: T) => void
  onDuplicate?: (item: T) => void
  onAdd: () => void
  enableResize?: boolean
  enableDuplicate?: boolean
  rowHeight?: number
  overscan?: number
}

export function MasterPageVirtualTable<T extends MasterItem>({
  items,
  columns,
  onEdit,
  onDelete,
  onDuplicate,
  onAdd,
  enableResize = true,
  enableDuplicate = true,
  rowHeight = 56,
  overscan = 5
}: MasterPageVirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  
  // Calculate default widths from column config
  const defaultWidths = columns.reduce((acc, col) => {
    acc[col.key as string] = col.width
    return acc
  }, {} as Record<string, number>)

  const { columnWidths, resizing, handleMouseDown, getColumnWidth } = useColumnResize({
    defaultWidths
  })

  // Calculate which rows are visible
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endIndex = Math.min(
    items.length, 
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  )
  const visibleItems = items.slice(startIndex, endIndex)

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }
    
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Calculate sticky positions
  const getStickyStyle = (column: ColumnConfig<T>, index: number) => {
    if (!column.sticky) return {}
    
    // For left sticky columns
    if (typeof column.stickyPosition === 'number') {
      return {
        position: 'sticky' as const,
        left: column.stickyPosition,
        zIndex: 10
      }
    }
    
    // For right sticky column (actions)
    if (column.key === 'actions') {
      return {
        position: 'sticky' as const,
        right: 0,
        zIndex: 10
      }
    }
    
    return {}
  }

  const totalHeight = items.length * rowHeight

  return (
    <div className="h-full flex flex-col">
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <table className="w-full border-collapse" style={{ position: 'sticky', top: 0 }}>
            <thead className="sticky top-0 z-20 bg-white">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.key as string}
                    className={`
                      text-left text-sm font-bold bg-gray-50 relative
                      ${column.sticky ? 'bg-gray-100' : ''}
                      ${resizing === column.key ? 'select-none' : ''}
                    `}
                    style={{
                      ...getStickyStyle(column, index),
                      width: getColumnWidth(column.key as string),
                      minWidth: getColumnWidth(column.key as string)
                    }}
                  >
                    <div className="px-4 py-3 flex items-center justify-between">
                      {column.label}
                      {enableResize && column.key !== 'actions' && (
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 hover:bg-blue-500 cursor-col-resize"
                          onMouseDown={(e) => handleMouseDown(column.key as string, e)}
                        />
                      )}
                    </div>
                  </th>
                ))}
                {/* Actions column */}
                <th
                  className="text-center text-sm font-bold bg-gray-100 sticky right-0 z-10"
                  style={{ width: 180, minWidth: 180 }}
                >
                  <div className="px-4 py-3">Actions</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-200"
                  style={{ 
                    height: rowHeight,
                    position: 'absolute',
                    top: (startIndex + index) * rowHeight,
                    width: '100%',
                    display: 'table',
                    tableLayout: 'fixed'
                  }}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={column.key as string}
                      className={`
                        text-sm
                        ${column.sticky ? 'bg-white border-r border-gray-300' : ''}
                      `}
                      style={{
                        ...getStickyStyle(column, colIndex),
                        width: getColumnWidth(column.key as string)
                      }}
                    >
                      <div className="px-4 py-2 truncate">
                        {column.render 
                          ? column.render(item)
                          : item[column.key as keyof T] as React.ReactNode
                        }
                      </div>
                    </td>
                  ))}
                  {/* Actions column */}
                  <td
                    className="text-center bg-white border-l border-gray-300 sticky right-0 z-10"
                    style={{ width: 180 }}
                  >
                    <div className="flex items-center justify-center gap-1 px-2">
                      {enableDuplicate && onDuplicate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDuplicate(item)}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item)}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Row Button */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          onClick={onAdd}
          className="w-full justify-start text-gray-600 hover:text-gray-900"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
      </div>
    </div>
  )
}