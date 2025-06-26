export function ensureMap<K, V>(data: unknown): Map<K, V> {
  try {
    if (data instanceof Map) return data
    if (Array.isArray(data)) return new Map(data)
    if (data && typeof data === 'object') return new Map(Object.entries(data)) as Map<K, V>
  } catch (error) {
    console.error('Error converting to Map:', error)
  }
  return new Map<K, V>()
}

export function safeMapUpdate<K, V>(
  map: Map<K, V>, 
  key: K, 
  value: V
): Map<K, V> {
  const newMap = new Map(map)
  newMap.set(key, value)
  return newMap
}

export function safeMapDelete<K, V>(
  map: Map<K, V>, 
  key: K
): Map<K, V> {
  const newMap = new Map(map)
  newMap.delete(key)
  return newMap
}