import { useMemo } from 'react'
import { EventInfo } from '@/types'
import { EnhancedParameter } from '@/utils/dataSourceParameterUtils'
import { useCSVDataStore } from '@/stores/useCSVDataStore'
import { getParametersFromDataSources } from '@/utils/dataSourceCSVUtils'

interface UseParameterSelectionOptions {
  selectedDataSourceItems?: EventInfo[]
  searchQuery?: string
}

export function useParameterSelection({ 
  selectedDataSourceItems,
  searchQuery = ''
}: UseParameterSelectionOptions = {}) {
  const { datasets } = useCSVDataStore()

  // Get parameters from CSV data sources only
  const enhancedParameters = useMemo(() => {
    if (!selectedDataSourceItems || selectedDataSourceItems.length === 0) {
      return []
    }
    
    // Extract parameters from actual CSV data
    return getParametersFromDataSources(selectedDataSourceItems, datasets)
  }, [selectedDataSourceItems, datasets])

  // Filter by search query
  const searchFilteredParameters = useMemo(() => {
    if (!searchQuery) return enhancedParameters
    
    const query = searchQuery.toLowerCase()
    return enhancedParameters.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.unit.toLowerCase().includes(query)
    )
  }, [enhancedParameters, searchQuery])

  return {
    enhancedParameters,
    searchFilteredParameters
  }
}