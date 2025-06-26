"use client"

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PatternFilterSectionProps {
  fileNamePattern: string
  setFileNamePattern: (pattern: string) => void
  patternType: 'wildcard' | 'regex'
  setPatternType: (type: 'wildcard' | 'regex') => void
  filteredCount: number
  totalCount: number
}

export function PatternFilterSection({
  fileNamePattern,
  setFileNamePattern,
  patternType,
  setPatternType,
  filteredCount,
  totalCount
}: PatternFilterSectionProps) {
  const hasFilter = totalCount > 0 && fileNamePattern.trim() !== ''
  const isFiltered = hasFilter && filteredCount !== totalCount

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Filter (Optional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Pattern Type</Label>
          <RadioGroup value={patternType} onValueChange={(value) => setPatternType(value as 'wildcard' | 'regex')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="wildcard" id="wildcard" />
              <Label htmlFor="wildcard" className="font-normal">
                Wildcard (* matches any characters, ? matches single character)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="regex" id="regex" />
              <Label htmlFor="regex" className="font-normal">
                Regular Expression
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pattern">File Name Pattern</Label>
          <Input
            id="pattern"
            placeholder={patternType === 'wildcard' ? 'e.g., data_*.csv' : 'e.g., ^data_\\d+\\.csv$'}
            value={fileNamePattern}
            onChange={(e) => setFileNamePattern(e.target.value)}
          />
          {isFiltered && (
            <p className="text-sm text-muted-foreground">
              Showing {filteredCount} of {totalCount} files
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}