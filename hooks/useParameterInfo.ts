import { useMemo } from 'react'
import { useParameterStore } from '@/stores/useParameterStore'
import { parseParameterKey } from '@/utils/parameterUtils'

export function useParameterInfo(parameterValue: string, fallbackUnit: string = '') {
  const { parameters } = useParameterStore()

  return useMemo(() => {
    if (!parameterValue) return { name: '', unit: '' }
    
    const parsed = parseParameterKey(parameterValue)
    if (parsed) return parsed
    
    // Legacy format - try to find matching parameter
    const foundParam = parameters.find(p => 
      p.id === parameterValue || p.name === parameterValue
    )
    
    return foundParam 
      ? { name: foundParam.name, unit: foundParam.unit }
      : { name: parameterValue, unit: fallbackUnit }
  }, [parameterValue, fallbackUnit, parameters])
}