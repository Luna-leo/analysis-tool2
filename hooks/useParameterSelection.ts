import { useMemo } from 'react'
import { useParameterStore } from '@/stores/useParameterStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { EventInfo } from '@/types'
import { 
  EnhancedParameter, 
  mergeParametersWithPriority,
  shouldUseDataSourcePriority 
} from '@/utils/dataSourceParameterUtils'

interface UseParameterSelectionOptions {
  selectedDataSourceItems?: EventInfo[]
  searchQuery?: string
}

export function useParameterSelection({ 
  selectedDataSourceItems,
  searchQuery = ''
}: UseParameterSelectionOptions = {}) {
  const { getUniqueParameters } = useParameterStore()
  const { settings } = useSettingsStore()

  // Get parameters based on settings
  const enhancedParameters = useMemo(() => {
    const masterParams = getUniqueParameters()
    
    // Check if we should use data source priority
    const useDataSourcePriority = shouldUseDataSourcePriority(
      settings.toolDefaults.parameterSource
    ) && selectedDataSourceItems && selectedDataSourceItems.length > 0
    
    if (!useDataSourcePriority) {
      // Convert to enhanced parameters without data source info
      return masterParams.map(param => ({
        ...param,
        isFromDataSource: false,
        matchesDataSource: false
      } as EnhancedParameter))
    }
    
    // TODO: Get actual CSV data from selected data sources
    // For now, we'll simulate data source parameters
    const dataSourceParams: EnhancedParameter[] = []
    
    // Merge master and data source parameters with priority
    return mergeParametersWithPriority(masterParams, dataSourceParams)
  }, [getUniqueParameters, settings.toolDefaults.parameterSource, selectedDataSourceItems])

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