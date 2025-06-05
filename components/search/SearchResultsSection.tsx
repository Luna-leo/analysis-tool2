import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchResult } from '@/types'

interface SearchResultsSectionProps {
  searchResults: SearchResult[]
  selectedResultIds: Set<string>
  onSelectedResultIdsChange: (ids: Set<string>) => void
  onAddSelectedResults: () => void
  labelName?: string
  onLabelNameChange?: (name: string) => void
  resultLabels?: Map<string, string>
  onResultLabelsChange?: (labels: Map<string, string>) => void
  duration?: number
  onDurationChange?: (duration: number) => void
  durationUnit?: 'seconds' | 'minutes' | 'hours'
  onDurationUnitChange?: (unit: 'seconds' | 'minutes' | 'hours') => void
}

export const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  searchResults,
  selectedResultIds,
  onSelectedResultIdsChange,
  onAddSelectedResults,
  labelName,
  onLabelNameChange,
  resultLabels = new Map(),
  onResultLabelsChange,
  duration = 10,
  onDurationChange,
  durationUnit = 'minutes',
  onDurationUnitChange
}) => {

  const handleBulkLabelUpdate = () => {
    if (!onResultLabelsChange || !labelName) return
    
    const newLabels = new Map(resultLabels)
    selectedResultIds.forEach(id => {
      newLabels.set(id, labelName)
    })
    onResultLabelsChange(newLabels)
  }

  const handleIndividualLabelChange = (resultId: string, label: string) => {
    if (!onResultLabelsChange) return
    
    const newLabels = new Map(resultLabels)
    newLabels.set(resultId, label)
    onResultLabelsChange(newLabels)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">Search Results</CardTitle>
          <div className="flex items-end gap-2">
            {onLabelNameChange && (
              <div className="flex flex-col gap-1">
                <Label htmlFor="legend-name" className="text-xs text-muted-foreground">
                  Legend (Bulk Set)
                </Label>
                <div className="flex gap-1">
                  <Input
                    id="legend-name"
                    value={labelName || ''}
                    onChange={(e) => onLabelNameChange(e.target.value)}
                    placeholder="Enter legend"
                    className="h-8 w-32 text-xs"
                  />
                  <Button
                    onClick={handleBulkLabelUpdate}
                    disabled={selectedResultIds.size === 0 || !labelName}
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 text-xs"
                  >
                    Apply to Selected
                  </Button>
                </div>
              </div>
            )}
            {onDurationChange && (
              <div className="flex flex-col gap-1">
                <Label htmlFor="duration" className="text-xs text-muted-foreground">
                  Data Collection Period
                </Label>
                <div className="flex gap-1">
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => onDurationChange(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-8 w-16 text-xs"
                  />
                  {onDurationUnitChange && (
                    <Select value={durationUnit} onValueChange={onDurationUnitChange}>
                      <SelectTrigger className="h-8 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seconds">Seconds</SelectItem>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}
            <Button
              onClick={onAddSelectedResults}
              disabled={selectedResultIds.size === 0}
              className="h-8"
            >
              Add Selected ({selectedResultIds.size}) to Data Source
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {searchResults.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={searchResults.length > 0 && searchResults.every(r => selectedResultIds.has(r.id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onSelectedResultIdsChange(new Set(searchResults.map(r => r.id)))
                          } else {
                            onSelectedResultIdsChange(new Set())
                          }
                        }}
                        className="h-3 w-3"
                      />
                    </TableHead>
                    <TableHead className="h-8 text-xs px-2">Plant</TableHead>
                    <TableHead className="h-8 text-xs px-2">Machine</TableHead>
                    <TableHead className="h-8 text-xs px-2">Timestamp</TableHead>
                    <TableHead className="h-8 text-xs px-2">Legend</TableHead>
                    <TableHead className="h-8 text-xs px-2">Matched Conditions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((result) => (
                    <TableRow 
                      key={result.id}
                      className={`cursor-pointer ${selectedResultIds.has(result.id) ? "bg-primary/10" : ""}`}
                      onClick={() => {
                        const newSelectedIds = new Set(selectedResultIds)
                        if (selectedResultIds.has(result.id)) {
                          newSelectedIds.delete(result.id)
                        } else {
                          newSelectedIds.add(result.id)
                        }
                        onSelectedResultIdsChange(newSelectedIds)
                      }}
                    >
                      <TableCell className="px-1 py-1">
                        <Checkbox
                          checked={selectedResultIds.has(result.id)}
                          onCheckedChange={(checked) => {
                            const newSelectedIds = new Set(selectedResultIds)
                            if (checked) {
                              newSelectedIds.add(result.id)
                            } else {
                              newSelectedIds.delete(result.id)
                            }
                            onSelectedResultIdsChange(newSelectedIds)
                          }}
                          className="h-3 w-3"
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs">
                        {result.plant || 'Unknown'}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs">
                        {result.machineNo || 'Unknown'}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs">
                        <div className="font-mono leading-tight">
                          <div>{result.timestamp.split("T")[0]}</div>
                          <div>{result.timestamp.split("T")[1]}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs">
                        <Input
                          value={resultLabels.get(result.id) || ''}
                          onChange={(e) => handleIndividualLabelChange(result.id, e.target.value)}
                          placeholder="Enter legend"
                          className="h-6 text-xs border-0 bg-transparent p-1 focus-visible:ring-1"
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs">
                        <div className="leading-tight">
                          {result.matchedConditions.map((condition, idx) => (
                            <div key={idx} className="bg-green-100 px-1 py-0.5 rounded text-xs mb-0.5">
                              {condition}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No search results yet. Configure search conditions and execute search.
          </div>
        )}
      </CardContent>
    </Card>
  )
}