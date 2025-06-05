import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchResult } from '@/types'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface SearchResultsSectionProps {
  searchResults: SearchResult[]
  selectedResultIds: Set<string>
  onSelectedResultIdsChange: (ids: Set<string>) => void
  onAddSelectedResults: () => void
  labelName?: string
  onLabelNameChange?: (name: string) => void
}

interface GroupedResults {
  plant: string
  machineNo: string
  results: SearchResult[]
}

export const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  searchResults,
  selectedResultIds,
  onSelectedResultIdsChange,
  onAddSelectedResults,
  labelName,
  onLabelNameChange
}) => {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())

  // Group results by plant and machine
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, GroupedResults> = {}
    
    searchResults.forEach(result => {
      const plant = result.plant || 'Unknown'
      const machineNo = result.machineNo || 'Unknown'
      const key = `${plant}_${machineNo}`
      
      if (!groups[key]) {
        groups[key] = {
          plant,
          machineNo,
          results: []
        }
      }
      
      groups[key].results.push(result)
    })
    
    return Object.values(groups).sort((a, b) => {
      if (a.plant !== b.plant) return a.plant.localeCompare(b.plant)
      return a.machineNo.localeCompare(b.machineNo)
    })
  }, [searchResults])

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleAllGroups = () => {
    if (expandedGroups.size === groupedResults.length) {
      setExpandedGroups(new Set())
    } else {
      setExpandedGroups(new Set(groupedResults.map(g => `${g.plant}_${g.machineNo}`)))
    }
  }

  const isGroupSelected = (group: GroupedResults) => {
    return group.results.every(r => selectedResultIds.has(r.id))
  }

  const isGroupPartiallySelected = (group: GroupedResults) => {
    return group.results.some(r => selectedResultIds.has(r.id)) && !isGroupSelected(group)
  }

  const toggleGroupSelection = (group: GroupedResults) => {
    const newSelectedIds = new Set(selectedResultIds)
    if (isGroupSelected(group)) {
      group.results.forEach(r => newSelectedIds.delete(r.id))
    } else {
      group.results.forEach(r => newSelectedIds.add(r.id))
    }
    onSelectedResultIdsChange(newSelectedIds)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Search Results</CardTitle>
            {groupedResults.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllGroups}
                className="h-7 text-xs"
              >
                {expandedGroups.size === groupedResults.length ? 'Collapse All' : 'Expand All'}
              </Button>
            )}
          </div>
          <div className="flex items-end gap-2">
            {onLabelNameChange && (
              <div className="flex flex-col gap-1">
                <Label htmlFor="legend-name" className="text-xs text-muted-foreground">
                  Legend
                </Label>
                <Input
                  id="legend-name"
                  value={labelName || ''}
                  onChange={(e) => onLabelNameChange(e.target.value)}
                  placeholder="Enter legend"
                  className="h-8 w-40 text-xs"
                />
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
      <CardContent>
        {groupedResults.length > 0 ? (
          <div className="space-y-4">
            {groupedResults.map((group) => {
              const groupKey = `${group.plant}_${group.machineNo}`
              const isExpanded = expandedGroups.has(groupKey)
              
              return (
                <Collapsible key={groupKey} open={isExpanded}>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/30 p-3 flex items-center gap-3">
                      <Checkbox
                        checked={isGroupSelected(group)}
                        indeterminate={isGroupPartiallySelected(group) ? true : undefined}
                        onCheckedChange={() => toggleGroupSelection(group)}
                        className="h-4 w-4"
                      />
                      <CollapsibleTrigger
                        onClick={() => toggleGroup(groupKey)}
                        className="flex items-center gap-2 cursor-pointer hover:text-primary flex-1"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="font-medium">
                          Plant: {group.plant} | Machine No: {group.machineNo}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({group.results.length} results)
                        </span>
                      </CollapsibleTrigger>
                    </div>
                    
                    <CollapsibleContent>
                      <div className="border-t">
                        <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={isGroupSelected(group)}
                                onCheckedChange={() => toggleGroupSelection(group)}
                                className="h-3 w-3"
                              />
                            </TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Parameters</TableHead>
                            <TableHead>Matched Conditions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.results.map((result) => (
                            <TableRow key={result.id}>
                              <TableCell>
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
                              <TableCell className="font-mono text-sm">
                                {result.timestamp}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {Object.entries(result.parameters).map(([key, value]) => (
                                    <div key={key} className="text-sm">
                                      <span className="font-medium">{key}:</span> {value}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {result.matchedConditions.map((condition, idx) => (
                                    <div key={idx} className="text-sm bg-green-100 px-2 py-1 rounded">
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
                  </CollapsibleContent>
                </div>
              </Collapsible>
              )
            })}
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