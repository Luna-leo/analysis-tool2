"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, X, ChevronDown, ChevronRight, Edit3, Clock } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchResult } from "@/types"
import { formatDateTimeForDisplay } from "@/lib/dateUtils"

interface SearchResultsProps {
  searchResults: SearchResult[]
  selectedResultIds: Set<string>
  resultLabels: Map<string, string>
  searchResultsOpen: boolean
  setSearchResultsOpen: (open: boolean) => void
  onToggleResult: (resultId: string) => void
  onSelectAllResults: () => void
  onLabelChange: (resultId: string, label: string) => void
  onBulkLabelChange?: (resultIds: Set<string>, label: string) => void
  onAddSearchResults: () => void
  onClearResults: () => void
  onBulkDurationChange?: (resultIds: Set<string>, duration: number, unit: 's' | 'm' | 'h') => void
}

export function SearchResults({
  searchResults,
  selectedResultIds,
  resultLabels,
  searchResultsOpen,
  setSearchResultsOpen,
  onToggleResult,
  onSelectAllResults,
  onLabelChange,
  onBulkLabelChange,
  onAddSearchResults,
  onClearResults,
  onBulkDurationChange,
}: SearchResultsProps) {
  const [bulkLegend, setBulkLegend] = useState("")
  const [bulkDuration, setBulkDuration] = useState("")
  const [bulkDurationUnit, setBulkDurationUnit] = useState<'s' | 'm' | 'h'>('m')

  const handleBulkLegendApply = () => {
    if (bulkLegend && selectedResultIds.size > 0) {
      if (onBulkLabelChange) {
        onBulkLabelChange(selectedResultIds, bulkLegend)
      } else {
        // Fallback to individual updates
        selectedResultIds.forEach(id => {
          onLabelChange(id, bulkLegend)
        })
      }
    }
  }

  if (searchResults.length === 0) {
    return null
  }

  return (
    <div className="border rounded-lg bg-muted/30">
      <Collapsible open={searchResultsOpen} onOpenChange={setSearchResultsOpen}>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 text-left hover:bg-muted/50 transition-colors p-1 rounded flex-1">
              {searchResultsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <div>
                <h5 className="font-medium text-sm">Search Results</h5>
                <p className="text-xs text-muted-foreground">
                  {searchResults.length} results found using filter conditions
                </p>
              </div>
            </CollapsibleTrigger>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearResults}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <CollapsibleContent>
          <div className="px-3 pb-3">
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-sm px-2 w-[40px]">
                      <Checkbox
                        checked={selectedResultIds.size === searchResults.length && searchResults.length > 0}
                        onCheckedChange={onSelectAllResults}
                      />
                    </TableHead>
                    <TableHead className="h-8 text-sm px-2">Plant</TableHead>
                    <TableHead className="h-8 text-sm px-2">Machine</TableHead>
                    <TableHead className="h-8 text-sm px-2">Timestamp</TableHead>
                    <TableHead className="h-8 text-sm px-2">Legend</TableHead>
                    <TableHead className="h-8 text-sm px-2">Matched Conditions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="px-2 py-1">
                        <Checkbox
                          checked={selectedResultIds.has(result.id)}
                          onCheckedChange={() => onToggleResult(result.id)}
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1 text-sm">{result.plant}</TableCell>
                      <TableCell className="px-2 py-1 text-sm">{result.machineNo}</TableCell>
                      <TableCell className="px-2 py-1">
                        <div className="leading-tight">
                          <div className="text-sm">{formatDateTimeForDisplay(result.timestamp).date}</div>
                          <div className="text-sm text-muted-foreground">{formatDateTimeForDisplay(result.timestamp).time}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <Input
                          value={resultLabels.get(result.id) || ''}
                          onChange={(e) => onLabelChange(result.id, e.target.value)}
                          placeholder="Enter legend"
                          className="h-6 text-xs"
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1 text-sm text-muted-foreground">
                        {result.matchedConditions.join(', ')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Bulk Operations */}
            {selectedResultIds.size > 0 && (
              <div className="mt-3 space-y-3 p-3 bg-muted/50 rounded-lg">
                <h6 className="text-sm font-medium">Bulk Operations for Selected Items</h6>
                
                {/* Bulk Legend */}
                <div className="space-y-2">
                  <Label className="text-xs">Set Legend for Selected</Label>
                  <div className="flex gap-2">
                    <Input
                      value={bulkLegend}
                      onChange={(e) => setBulkLegend(e.target.value)}
                      placeholder="Enter legend for selected items"
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkLegendApply}
                      disabled={!bulkLegend}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Bulk End Time */}
                <div className="space-y-2">
                  <Label className="text-xs">Set End Time (Duration from Timestamp)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={bulkDuration}
                      onChange={(e) => setBulkDuration(e.target.value)}
                      placeholder="Duration"
                      className="w-24 h-8 text-sm"
                    />
                    <Select value={bulkDurationUnit} onValueChange={(value: 's' | 'm' | 'h') => setBulkDurationUnit(value)}>
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="s">Seconds</SelectItem>
                        <SelectItem value="m">Minutes</SelectItem>
                        <SelectItem value="h">Hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (onBulkDurationChange && bulkDuration && Number(bulkDuration) > 0) {
                          onBulkDurationChange(selectedResultIds, Number(bulkDuration), bulkDurationUnit)
                        }
                      }}
                      disabled={!bulkDuration || Number(bulkDuration) <= 0 || !onBulkDurationChange}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <Button
              size="sm"
              variant="default"
              onClick={onAddSearchResults}
              disabled={selectedResultIds.size === 0}
              className="w-full mt-3"
            >
              <Check className="h-4 w-4 mr-2" />
              Add Selected Results to Data Source ({selectedResultIds.size} selected)
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}