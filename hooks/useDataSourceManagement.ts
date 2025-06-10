import { useState } from "react"
import { EventInfo, SearchCondition, SearchResult } from "@/types"

export function useDataSourceManagement() {
  const [events, setEvents] = useState<EventInfo[]>([
    {
      id: "1",
      plant: "Plant A",
      machineNo: "M001",
      label: "Maintenance",
      labelDescription: "Regular check",
      event: "Scheduled Stop",
      eventDetail: "Monthly maintenance",
      start: "2024-01-15T10:00:00",
      end: "2024-01-15T12:00:00",
    },
    {
      id: "2",
      plant: "Plant A",
      machineNo: "M002",
      label: "Production",
      labelDescription: "Normal run",
      event: "Normal Operation",
      eventDetail: "Batch processing",
      start: "2024-01-15T08:00:00",
      end: "2024-01-15T16:00:00",
    },
    {
      id: "3",
      plant: "Plant B",
      machineNo: "M003",
      label: "Alert",
      labelDescription: "Warning state",
      event: "Temperature Warning",
      eventDetail: "Above threshold",
      start: "2024-01-15T14:30:00",
      end: "2024-01-15T14:45:00",
    },
  ])

  const [periodPool, setPeriodPool] = useState<EventInfo[]>([])
  const [selectedPoolIds, setSelectedPoolIds] = useState<Set<string>>(new Set())
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set())
  const [resultLabels, setResultLabels] = useState<Map<string, string>>(new Map())
  const [isSearching, setIsSearching] = useState(false)
  const [appliedConditions, setAppliedConditions] = useState<SearchCondition[]>([])

  const handleAddEventsToPool = (eventsToAdd: EventInfo[]) => {
    const newPool = [...periodPool]
    const newlyAddedIds: string[] = []
    eventsToAdd.forEach((event) => {
      if (!newPool.find((p) => p.id === event.id)) {
        newPool.push(event)
        newlyAddedIds.push(event.id)
      }
    })
    setPeriodPool(newPool)
    // Automatically select newly added periods
    setSelectedPoolIds(new Set([...selectedPoolIds, ...newlyAddedIds]))
  }

  const handleRemoveFromPool = (periodId: string) => {
    setPeriodPool(periodPool.filter(p => p.id !== periodId))
    selectedPoolIds.delete(periodId)
    setSelectedPoolIds(new Set(selectedPoolIds))
  }

  const handleTogglePeriod = (periodId: string) => {
    const newSelectedIds = new Set(selectedPoolIds)
    if (newSelectedIds.has(periodId)) {
      newSelectedIds.delete(periodId)
    } else {
      newSelectedIds.add(periodId)
    }
    setSelectedPoolIds(newSelectedIds)
  }

  const handleSelectAll = () => {
    if (selectedPoolIds.size === periodPool.length) {
      setSelectedPoolIds(new Set())
    } else {
      setSelectedPoolIds(new Set(periodPool.map(p => p.id)))
    }
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
    
    const periodsToSearch = selectedPoolIds.size > 0 
      ? periodPool.filter(p => selectedPoolIds.has(p.id))
      : periodPool
    
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
  }
}