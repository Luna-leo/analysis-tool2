import { useState } from 'react'
import { EventInfo, SearchResult } from '@/types'

export const useSearchPeriod = (availableEvents: EventInfo[]) => {
  const [searchPeriodType, setSearchPeriodType] = useState<'events' | 'manual'>('events')
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [eventSearchQuery, setEventSearchQuery] = useState('')
  const [manualPeriod, setManualPeriod] = useState({
    start: '',
    end: '',
    plant: '',
    machineNo: ''
  })
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set())

  // Filter events based on search query
  const filteredEvents = availableEvents.filter(event => {
    if (!eventSearchQuery) return true
    
    const query = eventSearchQuery.toLowerCase()
    return (
      event.plant.toLowerCase().includes(query) ||
      event.machineNo.toLowerCase().includes(query) ||
      event.label.toLowerCase().includes(query) ||
      (event.labelDescription && event.labelDescription.toLowerCase().includes(query)) ||
      event.event.toLowerCase().includes(query) ||
      (event.eventDetail && event.eventDetail.toLowerCase().includes(query))
    )
  })

  const hasValidPeriod = () => {
    return searchPeriodType === 'events' 
      ? selectedEventIds.size > 0
      : manualPeriod.start && manualPeriod.end && manualPeriod.plant && manualPeriod.machineNo
  }

  const resetSearchResults = () => {
    setSelectedResultIds(new Set())
    setSearchResults([])
  }

  return {
    searchPeriodType,
    setSearchPeriodType,
    selectedEventIds,
    setSelectedEventIds,
    eventSearchQuery,
    setEventSearchQuery,
    manualPeriod,
    setManualPeriod,
    isSearching,
    setIsSearching,
    searchResults,
    setSearchResults,
    selectedResultIds,
    setSelectedResultIds,
    filteredEvents,
    hasValidPeriod,
    resetSearchResults
  }
}