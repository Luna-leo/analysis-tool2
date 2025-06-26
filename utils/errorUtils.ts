export function safeExecute<T>(
  operation: () => T,
  defaultValue: T,
  errorMessage?: string
): T {
  try {
    return operation()
  } catch (error) {
    console.error(errorMessage || 'Operation failed:', error)
    return defaultValue
  }
}

export async function safeAsyncExecute<T>(
  operation: () => Promise<T>,
  defaultValue: T,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error(errorMessage || 'Async operation failed:', error)
    return defaultValue
  }
}