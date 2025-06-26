import { useMemo } from 'react'
import { EventInfo } from '@/types'

/**
 * Hook to get the index of a data source within a list
 * @param dataSource - The data source to find
 * @param dataSourceList - The list of data sources
 * @returns The index of the data source, or 0 if not found
 */
export const useDataSourceIndex = (
  dataSource: EventInfo | null,
  dataSourceList: EventInfo[]
): number => {
  return useMemo(() => {
    if (!dataSource) return 0
    const index = dataSourceList.findIndex(ds => ds.id === dataSource.id)
    return index >= 0 ? index : 0
  }, [dataSource, dataSourceList])
}

/**
 * Get the index of a data source within a list
 * @param dataSourceId - The ID of the data source to find
 * @param dataSourceList - The list of data sources
 * @returns The index of the data source, or 0 if not found
 */
export const getDataSourceIndex = (
  dataSourceId: string,
  dataSourceList: EventInfo[]
): number => {
  const index = dataSourceList.findIndex(ds => ds.id === dataSourceId)
  return index >= 0 ? index : 0
}