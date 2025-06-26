"use client"

import React from 'react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ManualPeriod } from '@/types'

interface ManualPeriodSelectionProps {
  manualPeriod?: {
    start: string
    end: string
    plant: string
    machineNo: string
  }
  onManualPeriodChange?: (period: any) => void
  manualPeriods?: ManualPeriod[]
  onAddManualPeriod?: () => void
  onRemoveManualPeriod?: (id: string) => void
  onUpdateManualPeriod?: (id: string, updates: Partial<ManualPeriod>) => void
}

export const ManualPeriodSelection: React.FC<ManualPeriodSelectionProps> = ({
  manualPeriod,
  onManualPeriodChange,
  manualPeriods,
  onAddManualPeriod,
  onRemoveManualPeriod,
  onUpdateManualPeriod,
}) => {
  // Use new multiple periods if available, otherwise fall back to single period
  const periods = manualPeriods || (manualPeriod ? [{
    id: '1',
    ...manualPeriod
  }] : [])

  const handleUpdatePeriod = (id: string, updates: Partial<ManualPeriod>) => {
    if (onUpdateManualPeriod) {
      onUpdateManualPeriod(id, updates)
    } else if (onManualPeriodChange && manualPeriod) {
      // Fallback for single period
      onManualPeriodChange({ ...manualPeriod, ...updates })
    }
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 bg-muted/30 border-b">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Manual Period Entries:</Label>
            {onAddManualPeriod && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAddManualPeriod}
                className="h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Period
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-xs px-2">Plant</TableHead>
                <TableHead className="h-8 text-xs px-2">Machine</TableHead>
                <TableHead className="h-8 text-xs px-2">Start</TableHead>
                <TableHead className="h-8 text-xs px-2">End</TableHead>
                <TableHead className="w-12 h-8 text-xs px-2">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.length > 0 ? periods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="px-2 py-1 text-xs">
                    <Input
                      value={period.plant}
                      onChange={(e) => handleUpdatePeriod(period.id, { plant: e.target.value })}
                      placeholder="Enter plant name"
                      className="h-6 text-xs border-0 bg-transparent p-1 focus-visible:ring-1"
                    />
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs">
                    <Input
                      value={period.machineNo}
                      onChange={(e) => handleUpdatePeriod(period.id, { machineNo: e.target.value })}
                      placeholder="Enter machine number"
                      className="h-6 text-xs border-0 bg-transparent p-1 focus-visible:ring-1"
                    />
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs">
                    <Input
                      type="datetime-local"
                      step="1"
                      value={period.start}
                      onChange={(e) => handleUpdatePeriod(period.id, { start: e.target.value })}
                      className="h-6 text-xs border-0 bg-transparent p-1 focus-visible:ring-1 font-mono"
                    />
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs">
                    <Input
                      type="datetime-local"
                      step="1"
                      value={period.end}
                      onChange={(e) => handleUpdatePeriod(period.id, { end: e.target.value })}
                      className="h-6 text-xs border-0 bg-transparent p-1 focus-visible:ring-1 font-mono"
                    />
                  </TableCell>
                  <TableCell className="px-1 py-1">
                    {onRemoveManualPeriod && periods.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveManualPeriod(period.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-xs">
                    No manual periods added yet. Click "Add Period" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}