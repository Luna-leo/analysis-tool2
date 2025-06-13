"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Undo2, Palette } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EventInfo } from "@/types"
import { formatDateTimeForDisplay } from "@/utils/dateUtils"
import { DataSourceBadgePreview } from "../../../DataSourceBadgePreview"

interface SelectedDataSourceTableProps {
  selectedDataSourceItems: EventInfo[]
  onEditItem: (item: EventInfo) => void
  onReturnItem: (item: EventInfo) => void
  onOpenStyleDrawer?: (item: EventInfo) => void
  file?: any
  useDataSourceStyle?: boolean
}

export function SelectedDataSourceTable({
  selectedDataSourceItems,
  onEditItem,
  onReturnItem,
  onOpenStyleDrawer,
  file,
  useDataSourceStyle
}: SelectedDataSourceTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-8 text-sm px-2">Plant</TableHead>
            <TableHead className="h-8 text-sm px-2">Machine No</TableHead>
            <TableHead className="h-8 text-sm px-2">Legend</TableHead>
            <TableHead className="h-8 text-sm px-2">Start</TableHead>
            <TableHead className="h-8 text-sm px-2">End</TableHead>
            {useDataSourceStyle && onOpenStyleDrawer && file && (
              <TableHead className="h-8 text-sm px-2">Plot Style</TableHead>
            )}
            <TableHead className="h-8 text-sm w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedDataSourceItems.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell className="px-2 py-1 text-sm">{item.plant}</TableCell>
              <TableCell className="px-2 py-1 text-sm">{item.machineNo}</TableCell>
              <TableCell className="px-2 py-1 text-sm">
                <div className="leading-tight">
                  <div>{item.label}</div>
                  {item.labelDescription && (
                    <div className="text-muted-foreground">({item.labelDescription})</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-2 py-1">
                <div className="leading-tight">
                  <div className="text-sm">{formatDateTimeForDisplay(item.start).date}</div>
                  <div className="text-sm text-muted-foreground">{formatDateTimeForDisplay(item.start).time}</div>
                </div>
              </TableCell>
              <TableCell className="px-2 py-1">
                <div className="leading-tight">
                  <div className="text-sm">{formatDateTimeForDisplay(item.end).date}</div>
                  <div className="text-sm text-muted-foreground">{formatDateTimeForDisplay(item.end).time}</div>
                </div>
              </TableCell>
              {useDataSourceStyle && onOpenStyleDrawer && file && (
                <TableCell className="px-2 py-1">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs py-0.5 px-2"
                    onClick={() => onOpenStyleDrawer(item)}
                  >
                    <div className="flex items-center gap-1.5">
                      <DataSourceBadgePreview
                        dataSourceStyle={file.dataSourceStyles?.[item.id]}
                        defaultColor={getDefaultColor(item.id, index)}
                      />
                      <Palette className="h-3 w-3" />
                    </div>
                  </Badge>
                </TableCell>
              )}
              <TableCell className="px-1 py-1">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onEditItem(item)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onReturnItem(item)}
                    title="Return to original source"
                  >
                    <Undo2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Helper function to get default color for data source
const defaultColors = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
]

const getDefaultColor = (dataSourceId: string, index: number) => {
  // Use index for consistent color
  return defaultColors[index % defaultColors.length]
}