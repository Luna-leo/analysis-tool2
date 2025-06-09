"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface TimeOffsetSettingsProps {
  startOffset: number
  setStartOffset: (value: number) => void
  startOffsetUnit: 'min' | 'sec'
  setStartOffsetUnit: (value: 'min' | 'sec') => void
  endOffset: number
  setEndOffset: (value: number) => void
  endOffsetUnit: 'min' | 'sec'
  setEndOffsetUnit: (value: 'min' | 'sec') => void
  offsetSectionOpen: boolean
  setOffsetSectionOpen: (value: boolean) => void
}

export function TimeOffsetSettings({
  startOffset,
  setStartOffset,
  startOffsetUnit,
  setStartOffsetUnit,
  endOffset,
  setEndOffset,
  endOffsetUnit,
  setEndOffsetUnit,
  offsetSectionOpen,
  setOffsetSectionOpen
}: TimeOffsetSettingsProps) {
  const resetStartOffset = () => setStartOffset(0)
  const resetEndOffset = () => setEndOffset(0)

  return (
    <Collapsible open={offsetSectionOpen} onOpenChange={setOffsetSectionOpen}>
      <div className="border rounded-lg p-3 bg-background">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">Time Offset</h4>
              {!offsetSectionOpen && (startOffset !== 0 || endOffset !== 0) && (
                <div className="text-xs text-muted-foreground">
                  {startOffset !== 0 && `Start: ${startOffset > 0 ? '+' : ''}${startOffset}${startOffsetUnit}`}
                  {startOffset !== 0 && endOffset !== 0 && ', '}
                  {endOffset !== 0 && `End: ${endOffset > 0 ? '+' : ''}${endOffset}${endOffsetUnit}`}
                </div>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${offsetSectionOpen ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden">
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Start Offset:</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={startOffset}
                  onChange={(e) => setStartOffset(Number(e.target.value))}
                  className="w-16 h-7 text-xs"
                  placeholder="0"
                />
                <Select value={startOffsetUnit} onValueChange={setStartOffsetUnit}>
                  <SelectTrigger className="w-16 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="min">min</SelectItem>
                    <SelectItem value="sec">sec</SelectItem>
                  </SelectContent>
                </Select>
                {startOffset !== 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({startOffset > 0 ? '+' : ''}{startOffset}{startOffsetUnit})
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={resetStartOffset}
                  disabled={startOffset === 0}
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">End Offset:</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={endOffset}
                  onChange={(e) => setEndOffset(Number(e.target.value))}
                  className="w-16 h-7 text-xs"
                  placeholder="0"
                />
                <Select value={endOffsetUnit} onValueChange={setEndOffsetUnit}>
                  <SelectTrigger className="w-16 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="min">min</SelectItem>
                    <SelectItem value="sec">sec</SelectItem>
                  </SelectContent>
                </Select>
                {endOffset !== 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({endOffset > 0 ? '+' : ''}{endOffset}{endOffsetUnit})
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={resetEndOffset}
                  disabled={endOffset === 0}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}