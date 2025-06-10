"use client"

import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface DataTableColumn<T> {
  key: keyof T | string
  header: string
  sortable?: boolean
  resizable?: boolean
  width?: number
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T extends { id: string }> {
  data: T[]
  columns: DataTableColumn<T>[]
  onRowClick?: (item: T) => void
  // Sorting
  sortConfig?: { key: keyof T | null; direction: 'asc' | 'desc' }
  onSort?: (key: keyof T) => void
  // Selection
  selectedRows?: Set<string>
  onToggleRow?: (id: string) => void
  onToggleAll?: () => void
  // Resizing
  columnWidths?: { [key: string]: number }
  onColumnResize?: (column: string, width: number) => void
  // Pagination
  currentPage?: number
  pageSize?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  // Styling
  className?: string
  headerClassName?: string
  bodyClassName?: string
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  sortConfig,
  onSort,
  selectedRows,
  onToggleRow,
  onToggleAll,
  columnWidths,
  onColumnResize,
  currentPage = 1,
  pageSize,
  totalPages,
  onPageChange,
  className,
  headerClassName,
  bodyClassName
}: DataTableProps<T>) {
  const hasSelection = selectedRows !== undefined && onToggleRow !== undefined
  const hasPagination = totalPages !== undefined && onPageChange !== undefined

  const renderSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable || !onSort) return null

    const isActive = sortConfig?.key === column.key
    const direction = sortConfig?.direction

    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 ml-2"
        onClick={(e) => {
          e.stopPropagation()
          onSort(column.key as keyof T)
        }}
      >
        {!isActive && <ArrowUpDown className="h-4 w-4" />}
        {isActive && direction === 'asc' && <ArrowUp className="h-4 w-4" />}
        {isActive && direction === 'desc' && <ArrowDown className="h-4 w-4" />}
      </Button>
    )
  }

  const getCellValue = (item: T, column: DataTableColumn<T>) => {
    if (column.render) {
      return column.render(item)
    }
    
    // Handle nested keys like "user.name"
    const keys = (column.key as string).split('.')
    let value: any = item
    for (const key of keys) {
      value = value?.[key]
    }
    
    return value?.toString() || ''
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader className={headerClassName}>
            <TableRow>
              {hasSelection && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.size === data.length && data.length > 0}
                    onCheckedChange={onToggleAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key as string}
                  className={cn("relative", column.className)}
                  style={{ width: columnWidths?.[column.key as string] || column.width }}
                >
                  <div className="flex items-center">
                    {column.header}
                    {renderSortIcon(column)}
                  </div>
                  {column.resizable && onColumnResize && (
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-border"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        const startX = e.pageX
                        const startWidth = columnWidths?.[column.key as string] || column.width || 100

                        const handleMouseMove = (e: MouseEvent) => {
                          const diff = e.pageX - startX
                          onColumnResize(column.key as string, startWidth + diff)
                        }

                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove)
                          document.removeEventListener('mouseup', handleMouseUp)
                        }

                        document.addEventListener('mousemove', handleMouseMove)
                        document.addEventListener('mouseup', handleMouseUp)
                      }}
                    />
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className={bodyClassName}>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (hasSelection ? 1 : 0)}
                  className="h-24 text-center"
                >
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                    selectedRows?.has(item.id) && "bg-muted"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {hasSelection && (
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedRows.has(item.id)}
                        onCheckedChange={() => onToggleRow(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell
                      key={column.key as string}
                      className={column.className}
                    >
                      {getCellValue(item, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {hasPagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
            {pageSize && ` (${pageSize} items per page)`}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}