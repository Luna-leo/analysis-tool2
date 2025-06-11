import { Parameter } from '@/types/parameter'

export async function loadParametersFromCSV(): Promise<Parameter[]> {
  try {
    const response = await fetch('/data/sample_parameters.csv')
    const text = await response.text()
    
    const lines = text.trim().split('\n')
    if (lines.length === 0) return []
    
    // Skip header and BOM if present
    const headerLine = lines[0].replace(/^\uFEFF/, '')
    const headers = headerLine.split(',').map(h => h.trim())
    
    const parameters: Parameter[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      
      if (values.length >= 6) {
        parameters.push({
          id: values[0],
          name: values[1],
          unit: values[2],
          plant: values[3],
          machineNo: values[4],
          source: values[5]
        })
      }
    }
    
    return parameters
  } catch (error) {
    console.error('Failed to load parameters from CSV:', error)
    return []
  }
}

export function formatParameterLabel(parameter: Parameter): string {
  return `${parameter.name}\n${parameter.unit} / ${parameter.id}`
}

export function getUniqueParameterId(parameter: Parameter): string {
  return `${parameter.id}-${parameter.plant}-${parameter.machineNo}`
}

export function createParameterKey(name: string, unit: string): string {
  return `${name}|${unit}`
}

export function parseParameterKey(key: string): { name: string; unit: string } | null {
  if (!key.includes('|')) return null
  
  const [name, unit] = key.split('|')
  return { name, unit }
}