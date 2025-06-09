"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from 'lucide-react'
import { EventInfo, ManualPeriod } from '@/types'
import { EventPeriodSelection } from './EventPeriodSelection'
import { ManualPeriodSelection } from './ManualPeriodSelection'

interface SearchPeriodSectionProps {
  searchPeriodType: 'events' | 'manual'
  onSearchPeriodTypeChange: (type: 'events' | 'manual') => void
  selectedEventIds: Set<string>
  onSelectedEventIdsChange: (ids: Set<string>) => void
  eventSearchQuery: string
  onEventSearchQueryChange: (query: string) => void
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
  filteredEvents: EventInfo[]
  defaultOpen?: boolean
}

export const SearchPeriodSection: React.FC<SearchPeriodSectionProps> = ({
  searchPeriodType,
  onSearchPeriodTypeChange,
  selectedEventIds,
  onSelectedEventIdsChange,
  eventSearchQuery,
  onEventSearchQueryChange,
  manualPeriod,
  onManualPeriodChange,
  manualPeriods,
  onAddManualPeriod,
  onRemoveManualPeriod,
  onUpdateManualPeriod,
  filteredEvents,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  // Update isOpen when defaultOpen prop changes
  React.useEffect(() => {
    setIsOpen(defaultOpen)
  }, [defaultOpen])
  
  // Use new multiple periods if available, otherwise fall back to single period
  const periods = manualPeriods || (manualPeriod ? [{
    id: '1',
    ...manualPeriod
  }] : [])

  // Generate summary for collapsed state
  const getSummary = () => {
    if (searchPeriodType === 'manual') {
      const validPeriods = periods.filter(p => p.plant && p.machineNo && p.start && p.end)
      return `Manual: ${validPeriods.length} period(s) configured`
    } else {
      return `Events: ${selectedEventIds.size} selected from ${filteredEvents.length} available`
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={`${isOpen ? 'h-full' : 'h-auto'} flex flex-col`}>
      <Card className={`${isOpen ? 'h-full' : 'h-auto'} flex flex-col`}>
        <CollapsibleTrigger asChild>
          <CardHeader className={`flex-shrink-0 ${isOpen ? 'pb-6' : 'py-3'}`}>
            <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
              <div className="flex flex-col items-start">
                <CardTitle className="text-lg">Search Period</CardTitle>
                {!isOpen && (
                  <p className="text-xs text-muted-foreground mt-1">{getSummary()}</p>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent className={`${isOpen ? 'flex-1' : ''} overflow-hidden`}>
          <CardContent className={`${isOpen ? 'h-full' : ''} overflow-y-auto space-y-4`}>
            <RadioGroup
              value={searchPeriodType}
              onValueChange={onSearchPeriodTypeChange}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual">Manual Period Specification</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="events" id="events" />
                <Label htmlFor="events">Use Event Table Periods</Label>
              </div>
            </RadioGroup>
            
            {searchPeriodType === 'events' && (
              <EventPeriodSelection
                selectedEventIds={selectedEventIds}
                onSelectedEventIdsChange={onSelectedEventIdsChange}
                eventSearchQuery={eventSearchQuery}
                onEventSearchQueryChange={onEventSearchQueryChange}
                filteredEvents={filteredEvents}
              />
            )}
            
            {searchPeriodType === 'manual' && (
              <ManualPeriodSelection
                manualPeriod={manualPeriod}
                onManualPeriodChange={onManualPeriodChange}
                manualPeriods={manualPeriods}
                onAddManualPeriod={onAddManualPeriod}
                onRemoveManualPeriod={onRemoveManualPeriod}
                onUpdateManualPeriod={onUpdateManualPeriod}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

export { EventPeriodSelection } from './EventPeriodSelection'
export { ManualPeriodSelection } from './ManualPeriodSelection'