"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EventInfo } from "@/types"

interface SelectedDataSourceTableProps {
  selectedDataSourceItems: EventInfo[]
  onEditItem: (item: EventInfo) => void
  onRemoveItem: (itemId: string) => void
}

export function SelectedDataSourceTable({
  selectedDataSourceItems,
  onEditItem,
  onRemoveItem
}: SelectedDataSourceTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-8 text-xs px-2">Plant</TableHead>
            <TableHead className="h-8 text-xs px-2">Machine No</TableHead>
            <TableHead className="h-8 text-xs px-2">Legend</TableHead>
            <TableHead className="h-8 text-xs px-2">Start</TableHead>
            <TableHead className="h-8 text-xs px-2">End</TableHead>
            <TableHead className="h-8 text-xs w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedDataSourceItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="px-2 py-1 text-xs">{item.plant}</TableCell>
              <TableCell className="px-2 py-1 text-xs">{item.machineNo}</TableCell>
              <TableCell className="px-2 py-1 text-xs">
                {item.labelDescription ? `${item.label} (${item.labelDescription})` : item.label}
              </TableCell>
              <TableCell className="px-2 py-1 text-xs">
                <div>
                  <div>{item.start.split("T")[0]}</div>
                  <div>{item.start.split("T")[1]}</div>
                </div>
              </TableCell>
              <TableCell className="px-2 py-1 text-xs">
                <div>
                  <div>{item.end.split("T")[0]}</div>
                  <div>{item.end.split("T")[1]}</div>
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
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
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