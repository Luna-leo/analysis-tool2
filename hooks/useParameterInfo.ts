import { useMemo } from 'react'
import { parseParameterKey } from '@/utils/parameterUtils'

export function useParameterInfo(parameterValue: string, fallbackUnit: string = '') {
  return useMemo(() => {
    if (!parameterValue) return { name: '', unit: '' }
    
    const parsed = parseParameterKey(parameterValue)
    if (parsed) return parsed
    
    // If not a proper parameter key format, return the value as name
    return { name: parameterValue, unit: fallbackUnit }
  }, [parameterValue, fallbackUnit])
}