export const isBrowser = () => typeof window !== 'undefined'

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (isBrowser()) {
      try {
        return localStorage.getItem(key)
      } catch (error) {
        console.warn('Failed to get item from localStorage:', error)
        return null
      }
    }
    return null
  },
  
  setItem: (key: string, value: string): boolean => {
    if (isBrowser()) {
      try {
        localStorage.setItem(key, value)
        return true
      } catch (error) {
        console.warn('Failed to set item in localStorage:', error)
        return false
      }
    }
    return false
  },
  
  removeItem: (key: string): boolean => {
    if (isBrowser()) {
      try {
        localStorage.removeItem(key)
        return true
      } catch (error) {
        console.warn('Failed to remove item from localStorage:', error)
        return false
      }
    }
    return false
  },
  
  clear: (): boolean => {
    if (isBrowser()) {
      try {
        localStorage.clear()
        return true
      } catch (error) {
        console.warn('Failed to clear localStorage:', error)
        return false
      }
    }
    return false
  }
}

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (isBrowser()) {
      try {
        return sessionStorage.getItem(key)
      } catch (error) {
        console.warn('Failed to get item from sessionStorage:', error)
        return null
      }
    }
    return null
  },
  
  setItem: (key: string, value: string): boolean => {
    if (isBrowser()) {
      try {
        sessionStorage.setItem(key, value)
        return true
      } catch (error) {
        console.warn('Failed to set item in sessionStorage:', error)
        return false
      }
    }
    return false
  },
  
  removeItem: (key: string): boolean => {
    if (isBrowser()) {
      try {
        sessionStorage.removeItem(key)
        return true
      } catch (error) {
        console.warn('Failed to remove item from sessionStorage:', error)
        return false
      }
    }
    return false
  }
}