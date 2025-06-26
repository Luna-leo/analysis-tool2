import { Parameter } from '@/types/parameter'


export function createParameterKey(name: string, unit: string): string {
  return `${name}|${unit}`
}

export function parseParameterKey(key: string): { name: string; unit: string } | null {
  if (!key.includes('|')) return null
  
  const [name, unit] = key.split('|')
  return { name, unit }
}

export function cleanParameterName(param: string): string {
  return param.includes('|') ? param.split('|')[0] : param
}

export function cleanParameterNames(params: string[]): string[] {
  return params.map(cleanParameterName)
}

export function extractParameterUnit(param: string): string {
  if (!param.includes('|')) return ''
  const parts = param.split('|')
  return parts[1] || ''
}