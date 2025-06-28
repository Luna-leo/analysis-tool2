import { useState, useEffect, useMemo } from "react"
import { EventInfo, SearchCondition, SearchResult, PredefinedCondition } from "@/types"
import { useEventMasterStore } from "@/stores/useEventMasterStore"
import { useTriggerConditionStore } from "@/stores/useTriggerConditionStore"

export function useDataSourceManagement() {
  const eventMasterData = useEventMasterStore((state) => state.events)
  
  // Convert EventMaster data to EventInfo format and sync with Event Master
  const [events, setEvents] = useState<EventInfo[]>([])
  
  useEffect(() => {
    const eventInfoData = eventMasterData.map(event => ({
      id: event.id,
      plant: event.plant,
      machineNo: event.machineNo,
      label: event.label,
      labelDescription: event.labelDescription,
      event: event.event,
      eventDetail: event.eventDetail,
      start: typeof event.start === 'string' ? event.start : event.start.toISOString(),
      end: typeof event.end === 'string' ? event.end : event.end.toISOString(),
    }))
    setEvents(eventInfoData)
  }, [eventMasterData])

  const [periodPool, setPeriodPoolInternal] = useState<EventInfo[]>([])
  const [selectedPoolIds, setSelectedPoolIds] = useState<Set<string>>(new Set())
  
  // Wrapper for setPeriodPool with logging and verification
  const setPeriodPool = (newPool: EventInfo[] | ((prev: EventInfo[]) => EventInfo[])) => {
    console.log('[DEBUG] setPeriodPool called', {
      isFunction: typeof newPool === 'function',
      currentPoolLength: periodPool.length
    })
    
    setPeriodPoolInternal((prev) => {
      const nextPool = typeof newPool === 'function' ? newPool(prev) : newPool
      console.log('[DEBUG] periodPool update', {
        previousLength: prev.length,
        newLength: nextPool.length,
        addedItems: nextPool.filter(item => !prev.find(p => p.id === item.id)).map(item => ({ id: item.id, label: item.label })),
        removedItems: prev.filter(item => !nextPool.find(p => p.id === item.id)).map(item => ({ id: item.id, label: item.label })),
        allIds: nextPool.map(p => p.id)
      })
      return nextPool
    })
  }
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set())
  const [resultLabels, setResultLabels] = useState<Map<string, string>>(new Map())
  const [isSearching, setIsSearching] = useState(false)
  const [appliedConditions, setAppliedConditions] = useState<SearchCondition[]>([])
  
  // Filter-related state
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null)
  const [filteredPoolIds, setFilteredPoolIds] = useState<Set<string> | null>(null)
  const { getConditionById } = useTriggerConditionStore()

  const handleAddEventsToPool = (eventsToAdd: EventInfo[]) => {
    console.log('[DEBUG] handleAddEventsToPool called with', eventsToAdd.length, 'events')
    const newlyAddedIds: string[] = []
    
    setPeriodPool((currentPool) => {
      console.log('[DEBUG] Inside setPeriodPool callback, current pool:', currentPool.length)
      const newPool = [...currentPool]
      eventsToAdd.forEach((event) => {
        if (!newPool.find((p) => p.id === event.id)) {
          newPool.push(event)
          newlyAddedIds.push(event.id)
          console.log('[DEBUG] Adding event to pool:', event.id)
        }
      })
      console.log('[DEBUG] New pool will have', newPool.length, 'items')
      return newPool
    })
    
    // Automatically select newly added periods
    setTimeout(() => {
      setSelectedPoolIds((currentIds) => {
        console.log('[DEBUG] Auto-selecting', newlyAddedIds.length, 'newly added items')
        return new Set([...currentIds, ...newlyAddedIds])
      })
    }, 0)
  }

  const handleRemoveFromPool = (periodId: string) => {
    setPeriodPool((currentPool) => currentPool.filter(p => p.id !== periodId))
    setSelectedPoolIds((currentIds) => {
      const newIds = new Set(currentIds)
      newIds.delete(periodId)
      return newIds
    })
  }

  const handleTogglePeriod = (periodId: string) => {
    setSelectedPoolIds((currentIds) => {
      const newSelectedIds = new Set(currentIds)
      if (newSelectedIds.has(periodId)) {
        newSelectedIds.delete(periodId)
      } else {
        newSelectedIds.add(periodId)
      }
      return newSelectedIds
    })
  }

  const handleSelectAll = () => {
    setPeriodPoolInternal((currentPool) => {
      setSelectedPoolIds((currentIds) => {
        if (currentIds.size === currentPool.length) {
          return new Set()
        } else {
          return new Set(currentPool.map(p => p.id))
        }
      })
      return currentPool // Don't modify the periodPool
    })
  }

  const handleToggleResult = (resultId: string) => {
    const newSelected = new Set(selectedResultIds)
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId)
    } else {
      newSelected.add(resultId)
    }
    setSelectedResultIds(newSelected)
  }

  const handleSelectAllResults = () => {
    if (selectedResultIds.size === searchResults.length) {
      setSelectedResultIds(new Set())
    } else {
      setSelectedResultIds(new Set(searchResults.map(r => r.id)))
    }
  }

  const handleLabelChange = (resultId: string, label: string) => {
    const newLabels = new Map(resultLabels)
    newLabels.set(resultId, label)
    setResultLabels(newLabels)
  }

  const handleBulkLabelChange = (resultIds: Set<string>, label: string) => {
    const newLabels = new Map(resultLabels)
    resultIds.forEach(id => {
      newLabels.set(id, label)
    })
    setResultLabels(newLabels)
  }

  const handleClearResults = () => {
    setSearchResults([])
    setSelectedResultIds(new Set())
    setResultLabels(new Map())
  }

  const handleApplyConditions = async (conditions: SearchCondition[]) => {
    setAppliedConditions(conditions)
    setIsSearching(true)
    
    // Use refs to get current state - simpler approach
    const currentPeriodPool = periodPool // This will be the current value at time of call
    const currentSelectedIds = selectedPoolIds
    
    const periodsToSearch = currentSelectedIds.size > 0 
      ? currentPeriodPool.filter(p => currentSelectedIds.has(p.id))
      : currentPeriodPool
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockResults: SearchResult[] = []
    
    periodsToSearch.forEach((period) => {
      const resultsCount = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < resultsCount; i++) {
        const startTime = new Date(period.start)
        const endTime = new Date(period.end)
        const timeDiff = endTime.getTime() - startTime.getTime()
        const randomTime = new Date(startTime.getTime() + Math.random() * timeDiff)
        
        mockResults.push({
          id: `${period.id}_result_${i}`,
          timestamp: randomTime.toISOString(),
          plant: period.plant,
          machineNo: period.machineNo,
          parameters: { 
            temperature: 80 + Math.random() * 20, 
            pressure: 10 + Math.random() * 5, 
            flow: 40 + Math.random() * 20, 
            speed: 50 + Math.random() * 20 
          },
          matchedConditions: conditions.map(c => `${c.parameter} ${c.operator} ${c.value}`)
        })
      }
    })
    
    setSearchResults(mockResults)
    setIsSearching(false)
  }

  // Evaluate if an item matches the filter conditions
  const evaluateItemAgainstConditions = (item: EventInfo, conditions: SearchCondition[]): boolean => {
    // For now, simple mock evaluation - in real implementation, this would check actual data
    return conditions.length === 0 || Math.random() > 0.3
  }

  // Apply filter to selected period pool items and generate search results
  const handleApplyFilter = (filterId: string | null) => {
    setActiveFilterId(filterId)
    
    if (!filterId) {
      // Clear search results when filter is removed
      setSearchResults([])
      setSelectedResultIds(new Set())
      setResultLabels(new Map())
      return
    }
    
    // Get conditions from selected filter
    const filter = getConditionById(filterId)
    if (!filter?.conditions) {
      return
    }
    
    // Get only selected items from period pool
    const selectedItems = periodPool.filter(item => selectedPoolIds.has(item.id))
    
    if (selectedItems.length === 0) {
      setSearchResults([])
      return
    }
    
    // Group selected items by Plant/Machine No
    const groupedItems = new Map<string, EventInfo[]>()
    selectedItems.forEach(item => {
      const key = `${item.plant}_${item.machineNo}`
      if (!groupedItems.has(key)) {
        groupedItems.set(key, [])
      }
      groupedItems.get(key)!.push(item)
    })
    
    // Generate search results based on conditions
    const results: SearchResult[] = []
    let resultIndex = 0
    
    groupedItems.forEach((items, key) => {
      const [plant, machineNo] = key.split('_')
      
      // For each group, evaluate conditions and create search results
      items.forEach(item => {
        if (evaluateItemAgainstConditions(item, filter.conditions)) {
          // Create a search result for each matching period
          const result: SearchResult = {
            id: `result_${Date.now()}_${resultIndex++}`,
            timestamp: item.start,
            plant,
            machineNo,
            parameters: {}, // Empty parameters for now
            matchedConditions: [filter.name]
          }
          results.push(result)
        }
      })
    })
    
    setSearchResults(results)
    setSelectedResultIds(new Set())
    setResultLabels(new Map())
  }

  const handleClearFilter = () => {
    setActiveFilterId(null)
    setFilteredPoolIds(null)
    // Clear search results when filter is cleared
    setSearchResults([])
    setSelectedResultIds(new Set())
    setResultLabels(new Map())
  }

  // Get filtered or unfiltered pool
  const displayedPeriodPool = useMemo(() => {
    const result = !filteredPoolIds ? periodPool : periodPool.filter(item => filteredPoolIds.has(item.id))
    console.log('[DEBUG] displayedPeriodPool computed', {
      periodPoolLength: periodPool.length,
      hasFilter: !!filteredPoolIds,
      filteredPoolIdsSize: filteredPoolIds?.size,
      displayedLength: result.length,
      activeFilterId
    })
    return result
  }, [periodPool, filteredPoolIds, activeFilterId])

  return {
    events,
    setEvents,
    periodPool,
    setPeriodPool,
    selectedPoolIds,
    setSelectedPoolIds,
    searchResults,
    setSearchResults,
    selectedResultIds,
    setSelectedResultIds,
    resultLabels,
    setResultLabels,
    isSearching,
    setIsSearching,
    appliedConditions,
    setAppliedConditions,
    handleAddEventsToPool,
    handleRemoveFromPool,
    handleTogglePeriod,
    handleSelectAll,
    handleToggleResult,
    handleSelectAllResults,
    handleLabelChange,
    handleBulkLabelChange,
    handleClearResults,
    handleApplyConditions,
    // Filter-related exports
    activeFilterId,
    filteredPoolIds,
    displayedPeriodPool,
    handleApplyFilter,
    handleClearFilter,
    getActiveFilterName: () => activeFilterId ? getConditionById(activeFilterId)?.name : null,
  }
}