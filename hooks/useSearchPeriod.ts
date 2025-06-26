import { useState } from 'react'
import { EventInfo, SearchResult, ManualPeriod } from '@/types'

export const useSearchPeriod = (availableEvents: EventInfo[]) => {
  const [searchPeriodType, setSearchPeriodType] = useState<'events' | 'manual'>('manual')
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [eventSearchQuery, setEventSearchQuery] = useState('')
  const [manualPeriods, setManualPeriods] = useState<ManualPeriod[]>([
    {
      id: '1',
      start: '',
      end: '',
      plant: '',
      machineNo: ''
    }
  ])
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set())
  const [resultLabels, setResultLabels] = useState<Map<string, string>>(new Map())

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

  const addManualPeriod = () => {
    const newId = (Math.max(...manualPeriods.map(p => parseInt(p.id))) + 1).toString()
    setManualPeriods([...manualPeriods, {
      id: newId,
      start: '',
      end: '',
      plant: '',
      machineNo: ''
    }])
  }

  const removeManualPeriod = (id: string) => {
    if (manualPeriods.length > 1) {
      setManualPeriods(manualPeriods.filter(p => p.id !== id))
    }
  }

  const updateManualPeriod = (id: string, updates: Partial<ManualPeriod>) => {
    setManualPeriods(manualPeriods.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ))
  }

  const hasValidPeriod = () => {
    if (searchPeriodType === 'events') {
      return selectedEventIds.size > 0
    } else {
      return manualPeriods.some(p => 
        p.start && p.end && p.plant && p.machineNo
      )
    }
  }

  const resetSearchResults = () => {
    setSelectedResultIds(new Set())
    setSearchResults([])
    setResultLabels(new Map())
  }

  // Group search results by plant and machine
  const groupedSearchResults = searchResults.reduce((acc, result) => {
    const key = `${result.plant || 'Unknown'}_${result.machineNo || 'Unknown'}`
    if (!acc[key]) {
      acc[key] = {
        plant: result.plant || 'Unknown',
        machineNo: result.machineNo || 'Unknown',
        results: []
      }
    }
    acc[key].results.push(result)
    return acc
  }, {} as Record<string, { plant: string, machineNo: string, results: SearchResult[] }>)

  // For backward compatibility
  const manualPeriod = manualPeriods[0] || {
    start: '',
    end: '',
    plant: '',
    machineNo: ''
  }
  
  const setManualPeriod = (period: Partial<ManualPeriod>) => {
    if (manualPeriods.length > 0) {
      updateManualPeriod(manualPeriods[0].id, period)
    }
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
    manualPeriods,
    setManualPeriods,
    addManualPeriod,
    removeManualPeriod,
    updateManualPeriod,
    isSearching,
    setIsSearching,
    searchResults,
    setSearchResults,
    selectedResultIds,
    setSelectedResultIds,
    resultLabels,
    setResultLabels,
    filteredEvents,
    hasValidPeriod,
    resetSearchResults,
    groupedSearchResults
  }
}