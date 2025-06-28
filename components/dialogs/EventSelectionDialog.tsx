import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EventInfo } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Database, AlertCircle } from "lucide-react"
import { formatDateTimeForDisplay } from "@/utils/dateUtils"
import { batchCheckDataAvailability, DataAvailability, calculatePeriodCoverage } from "@/utils/dataAvailabilityUtils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EventSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  events: EventInfo[]
  onAddEvents: (events: EventInfo[]) => void
}

export const EventSelectionDialog: React.FC<EventSelectionDialogProps> = ({
  isOpen,
  onClose,
  events,
  onAddEvents,
}) => {
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [dataAvailability, setDataAvailability] = useState<Map<string, DataAvailability>>(new Map())
  const [periodCoverage, setPeriodCoverage] = useState<Map<string, number>>(new Map())
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)

  // Check data availability when dialog opens or events change
  useEffect(() => {
    if (isOpen && events.length > 0) {
      checkAvailability()
    }
  }, [isOpen, events])

  const checkAvailability = async () => {
    setIsCheckingAvailability(true)
    try {
      const items = events.map(event => ({
        plant: event.plant,
        machineNo: event.machineNo
      }))
      
      // Remove duplicates
      const uniqueItems = Array.from(
        new Map(items.map(item => [`${item.plant}_${item.machineNo}`, item])).values()
      )
      
      const availability = await batchCheckDataAvailability(uniqueItems)
      setDataAvailability(availability)
      
      // Calculate period coverage for events with data
      const coverageMap = new Map<string, number>()
      for (const event of events) {
        const key = `${event.plant}_${event.machineNo}`
        if (availability.get(key)?.hasData) {
          const coverage = await calculatePeriodCoverage(
            event.plant,
            event.machineNo,
            event.start,
            event.end
          )
          coverageMap.set(event.id, coverage.coveragePercentage)
        }
      }
      setPeriodCoverage(coverageMap)
    } catch (error) {
      console.error('Error checking data availability:', error)
    } finally {
      setIsCheckingAvailability(false)
    }
  }

  const filteredEvents = events.filter(event => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      event.plant.toLowerCase().includes(query) ||
      event.machineNo.toLowerCase().includes(query) ||
      event.label.toLowerCase().includes(query) ||
      event.event.toLowerCase().includes(query)
    )
  })

  const handleToggleEvent = (eventId: string) => {
    const newSelectedIds = new Set(selectedEventIds)
    if (newSelectedIds.has(eventId)) {
      newSelectedIds.delete(eventId)
    } else {
      newSelectedIds.add(eventId)
    }
    setSelectedEventIds(newSelectedIds)
  }

  const handleSelectAll = () => {
    if (selectedEventIds.size === filteredEvents.length) {
      setSelectedEventIds(new Set())
    } else {
      setSelectedEventIds(new Set(filteredEvents.map(e => e.id)))
    }
  }

  const handleAdd = () => {
    const selectedEvents = events.filter(e => selectedEventIds.has(e.id))
    onAddEvents(selectedEvents)
    setSelectedEventIds(new Set())
    setSearchQuery('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Events</DialogTitle>
          <DialogDescription>
            Select events to add to the period pool
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Events Table */}
          <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1">
            <div className="overflow-auto" style={{ maxHeight: 'calc(80vh - 250px)' }}>
              <table className="text-sm w-full border-collapse">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-white border-b-2 border-gray-200">
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-center" style={{ width: '40px' }}>
                      <Checkbox
                        checked={selectedEventIds.size === filteredEvents.length && filteredEvents.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-left" style={{ width: '100px' }}>Plant</th>
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-left" style={{ width: '120px' }}>Machine No</th>
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-center" style={{ width: '60px' }}>Data</th>
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-left">Label</th>
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-left">Event</th>
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-left" style={{ width: '100px' }}>Start</th>
                    <th className="bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 text-left" style={{ width: '100px' }}>End</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr 
                      key={event.id} 
                      className="group hover:bg-blue-50 transition-colors border-b border-gray-100 cursor-pointer"
                      onClick={() => handleToggleEvent(event.id)}
                    >
                      <td 
                        className="px-2 py-1 text-center bg-white group-hover:bg-blue-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedEventIds.has(event.id)}
                          onCheckedChange={() => handleToggleEvent(event.id)}
                        />
                      </td>
                      <td className="px-2 py-1 bg-white group-hover:bg-blue-50">{event.plant}</td>
                      <td className="px-2 py-1 bg-white group-hover:bg-blue-50">{event.machineNo}</td>
                      <td className="px-2 py-1 bg-white group-hover:bg-blue-50 text-center">
                        {(() => {
                          const availability = dataAvailability.get(`${event.plant}_${event.machineNo}`)
                          const coverage = periodCoverage.get(event.id)
                          
                          if (isCheckingAvailability) {
                            return <div className="animate-pulse text-gray-400">...</div>
                          }
                          
                          if (availability?.hasData) {
                            const hasPartialData = coverage !== undefined && coverage < 80
                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="flex items-center justify-center gap-1">
                                      <Database 
                                        className={`h-4 w-4 ${
                                          hasPartialData ? 'text-yellow-600' : 'text-green-600'
                                        }`} 
                                      />
                                      {hasPartialData && (
                                        <span className="text-xs text-yellow-600 font-medium">
                                          {Math.round(coverage)}%
                                        </span>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <p>Data available</p>
                                      {coverage !== undefined && (
                                        <p className="text-xs">
                                          Coverage: {Math.round(coverage)}%
                                        </p>
                                      )}
                                      {hasPartialData && (
                                        <p className="text-xs text-yellow-600">
                                          Partial data - gaps may exist
                                        </p>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                          }
                          return <span className="text-gray-300">-</span>
                        })()}
                      </td>
                      <td className="px-2 py-1 bg-white group-hover:bg-blue-50">
                        <div className="leading-tight">
                          <div className="text-sm">{event.label}</div>
                          <div className="text-xs text-gray-500">{event.labelDescription || ""}</div>
                        </div>
                      </td>
                      <td className="px-2 py-1 bg-white group-hover:bg-blue-50">
                        <div className="leading-tight">
                          <div className="text-sm">{event.event}</div>
                          <div className="text-xs text-gray-500">{event.eventDetail || ""}</div>
                        </div>
                      </td>
                      <td className="px-2 py-1 bg-white group-hover:bg-blue-50">
                        <div className="leading-tight">
                          <div className="text-sm">{formatDateTimeForDisplay(event.start).date}</div>
                          <div className="text-xs text-gray-500">{formatDateTimeForDisplay(event.start).time}</div>
                        </div>
                      </td>
                      <td className="px-2 py-1 bg-white group-hover:bg-blue-50">
                        <div className="leading-tight">
                          <div className="text-sm">{formatDateTimeForDisplay(event.end).date}</div>
                          <div className="text-xs text-gray-500">{formatDateTimeForDisplay(event.end).time}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {selectedEventIds.size} event{selectedEventIds.size !== 1 ? 's' : ''} selected
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selectedEventIds.size === 0}>
            Add Selected Events
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}