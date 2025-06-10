"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Check, Filter, Trash2, Pencil, ChevronDown, ChevronRight, Plus, Calendar, FileText } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { EventInfo } from "@/types"
import { formatDateTimeForDisplay } from "@/utils/dateUtils"
import { EnhancedTriggerConditionSelector } from "./EnhancedTriggerConditionSelector"

interface PeriodPoolProps {
  periodPool: EventInfo[]
  displayedPeriodPool: EventInfo[]
  selectedPoolIds: Set<string>
  periodPoolOpen: boolean
  setPeriodPoolOpen: (open: boolean) => void
  onTogglePeriod: (periodId: string) => void
  onSelectAll: () => void
  onRemoveFromPool: (periodId: string) => void
  onEditPeriod: (period: EventInfo) => void
  onAddToDataSource: () => void
  onManualEntry: () => void
  onFromEvents: () => void
  onImportCSV: () => void
  activeFilterId: string | null
  onFilterChange: (filterId: string | null) => void
}

export function PeriodPool({
  periodPool,
  displayedPeriodPool,
  selectedPoolIds,
  periodPoolOpen,
  setPeriodPoolOpen,
  onTogglePeriod,
  onSelectAll,
  onRemoveFromPool,
  onEditPeriod,
  onAddToDataSource,
  onManualEntry,
  onFromEvents,
  onImportCSV,
  activeFilterId,
  onFilterChange,
}: PeriodPoolProps) {
  return (
    <div className="border rounded-lg bg-muted/30">
      <Collapsible open={periodPoolOpen} onOpenChange={setPeriodPoolOpen}>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 text-left hover:bg-muted/50 transition-colors p-1 rounded">
              {periodPoolOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <h4 className="font-medium text-sm">Period Pool</h4>
              {displayedPeriodPool.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({displayedPeriodPool.length}{activeFilterId && ` of ${periodPool.length}`})
                </span>
              )}
            </CollapsibleTrigger>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onManualEntry}
              >
                <Plus className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onFromEvents}
              >
                <Calendar className="h-4 w-4 mr-2" />
                From Events
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onImportCSV}
              >
                <FileText className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </div>
          </div>
        </div>
        
        <CollapsibleContent>
          <div className="px-3 pb-3">
            {displayedPeriodPool.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 text-sm px-2 w-[40px]">
                        <Checkbox
                          checked={selectedPoolIds.size === displayedPeriodPool.length && displayedPeriodPool.length > 0}
                          onCheckedChange={onSelectAll}
                        />
                      </TableHead>
                      <TableHead className="h-8 text-sm px-2">Plant</TableHead>
                      <TableHead className="h-8 text-sm px-2">Machine No</TableHead>
                      <TableHead className="h-8 text-sm px-2">Legend</TableHead>
                      <TableHead className="h-8 text-sm px-2">Start</TableHead>
                      <TableHead className="h-8 text-sm px-2">End</TableHead>
                      <TableHead className="h-8 text-sm w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedPeriodPool.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell className="px-2 py-1">
                          <Checkbox
                            checked={selectedPoolIds.has(period.id)}
                            onCheckedChange={() => onTogglePeriod(period.id)}
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1 text-sm">{period.plant}</TableCell>
                        <TableCell className="px-2 py-1 text-sm">{period.machineNo}</TableCell>
                        <TableCell className="px-2 py-1 text-sm">
                          <div className="leading-tight">
                            <div>{period.label}</div>
                            {period.labelDescription && (
                              <div className="text-muted-foreground">({period.labelDescription})</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-1">
                          <div className="leading-tight">
                            <div className="text-sm">{formatDateTimeForDisplay(period.start).date}</div>
                            <div className="text-sm text-muted-foreground">{formatDateTimeForDisplay(period.start).time}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-1">
                          <div className="leading-tight">
                            <div className="text-sm">{formatDateTimeForDisplay(period.end).date}</div>
                            <div className="text-sm text-muted-foreground">{formatDateTimeForDisplay(period.end).time}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-1 py-1">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditPeriod(period)}
                              className="h-6 w-6 p-0"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveFromPool(period.id)}
                              className="h-6 w-6 p-0"
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
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No periods in pool. Use Manual Entry or From Events to add periods.
              </div>
            )}

            {/* Actions - Always visible */}
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="default"
                onClick={onAddToDataSource}
                disabled={selectedPoolIds.size === 0}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Add to Data Source ({selectedPoolIds.size} selected)
              </Button>
              <div className="flex-1">
                <EnhancedTriggerConditionSelector
                  activeFilterId={activeFilterId}
                  onFilterChange={onFilterChange}
                  displayedItemsCount={displayedPeriodPool.length}
                  totalItemsCount={periodPool.length}
                  disabled={selectedPoolIds.size === 0}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}