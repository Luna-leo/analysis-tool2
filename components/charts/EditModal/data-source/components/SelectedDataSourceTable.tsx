"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Pencil, Undo2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EventInfo } from "@/types"
import { formatDateTimeForDisplay } from "@/lib/dateUtils"

interface SelectedDataSourceTableProps {
  selectedDataSourceItems: EventInfo[]
  onEditItem: (item: EventInfo) => void
  onReturnItem: (item: EventInfo) => void
}

export function SelectedDataSourceTable({
  selectedDataSourceItems,
  onEditItem,
  onReturnItem
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
            <TableHead className="h-8 text-sm w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedDataSourceItems.map((item) => (
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