"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Check, X, ChevronDown, ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { SearchResult } from "@/types"

interface SearchResultsProps {
  searchResults: SearchResult[]
  selectedResultIds: Set<string>
  resultLabels: Map<string, string>
  searchResultsOpen: boolean
  setSearchResultsOpen: (open: boolean) => void
  onToggleResult: (resultId: string) => void
  onSelectAllResults: () => void
  onLabelChange: (resultId: string, label: string) => void
  onAddSearchResults: () => void
  onClearResults: () => void
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
  onAddSearchResults,
  onClearResults,
}: SearchResultsProps) {
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
                    <TableHead className="h-8 text-xs px-2 w-[40px]">
                      <Checkbox
                        checked={selectedResultIds.size === searchResults.length && searchResults.length > 0}
                        onCheckedChange={onSelectAllResults}
                      />
                    </TableHead>
                    <TableHead className="h-8 text-xs px-2">Timestamp</TableHead>
                    <TableHead className="h-8 text-xs px-2">Plant</TableHead>
                    <TableHead className="h-8 text-xs px-2">Machine</TableHead>
                    <TableHead className="h-8 text-xs px-2">Label</TableHead>
                    <TableHead className="h-8 text-xs px-2">Matched Conditions</TableHead>
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
                      <TableCell className="px-2 py-1 text-xs">
                        <div>
                          <div>{result.timestamp.split("T")[0]}</div>
                          <div>{result.timestamp.split("T")[1]}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs">{result.plant}</TableCell>
                      <TableCell className="px-2 py-1 text-xs">{result.machineNo}</TableCell>
                      <TableCell className="px-2 py-1">
                        <Input
                          value={resultLabels.get(result.id) || ''}
                          onChange={(e) => onLabelChange(result.id, e.target.value)}
                          placeholder="Enter label"
                          className="h-6 text-xs"
                        />
                      </TableCell>
                      <TableCell className="px-2 py-1 text-xs text-muted-foreground">
                        {result.matchedConditions.join(', ')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
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