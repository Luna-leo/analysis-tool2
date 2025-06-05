import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
}

export const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  searchResults,
  selectedResultIds,
  onSelectedResultIdsChange,
  onAddSelectedResults
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Search Results</CardTitle>
          <Button
            onClick={onAddSelectedResults}
            disabled={selectedResultIds.size === 0}
          >
            Add Selected ({selectedResultIds.size}) to Data Source
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {searchResults.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedResultIds.size === searchResults.length && searchResults.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelectedResultIdsChange(new Set(searchResults.map(r => r.id)))
                      } else {
                        onSelectedResultIdsChange(new Set())
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Parameters</TableHead>
                <TableHead>Matched Conditions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((result) => (
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
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No search results yet. Configure search conditions and execute search.
          </div>
        )}
      </CardContent>
    </Card>
  )
}