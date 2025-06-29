/**
 * WebGL Memory Manager
 * Manages GPU memory usage and provides cleanup utilities
 */

interface WebGLResource {
  id: string
  type: 'buffer' | 'texture' | 'framebuffer' | 'deck-instance'
  size: number // bytes
  lastUsed: number // timestamp
  resource: any
}

class WebGLMemoryManager {
  private resources: Map<string, WebGLResource> = new Map()
  private maxMemoryMB: number = 512 // Default 512MB limit
  private cleanupThreshold: number = 0.8 // Cleanup when 80% full
  
  /**
   * Register a WebGL resource
   */
  register(id: string, type: WebGLResource['type'], resource: any, sizeInBytes: number) {
    this.resources.set(id, {
      id,
      type,
      size: sizeInBytes,
      lastUsed: Date.now(),
      resource
    })
    
    // Check if cleanup is needed
    if (this.shouldCleanup()) {
      this.performCleanup()
    }
  }
  
  /**
   * Unregister and cleanup a resource
   */
  unregister(id: string) {
    const resource = this.resources.get(id)
    if (resource) {
      this.cleanupResource(resource)
      this.resources.delete(id)
    }
  }
  
  /**
   * Update last used timestamp
   */
  touch(id: string) {
    const resource = this.resources.get(id)
    if (resource) {
      resource.lastUsed = Date.now()
    }
  }
  
  /**
   * Get current memory usage in bytes
   */
  getCurrentUsage(): number {
    let total = 0
    this.resources.forEach(resource => {
      total += resource.size
    })
    return total
  }
  
  /**
   * Check if cleanup should be performed
   */
  private shouldCleanup(): boolean {
    const currentUsageMB = this.getCurrentUsage() / (1024 * 1024)
    return currentUsageMB > (this.maxMemoryMB * this.cleanupThreshold)
  }
  
  /**
   * Perform memory cleanup
   */
  private performCleanup() {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes
    
    // Sort resources by last used time
    const sortedResources = Array.from(this.resources.values())
      .sort((a, b) => a.lastUsed - b.lastUsed)
    
    // Remove oldest resources until we're under threshold
    for (const resource of sortedResources) {
      if (now - resource.lastUsed > maxAge) {
        this.unregister(resource.id)
        
        if (!this.shouldCleanup()) {
          break
        }
      }
    }
  }
  
  /**
   * Cleanup a specific resource
   */
  private cleanupResource(resource: WebGLResource) {
    switch (resource.type) {
      case 'deck-instance':
        if (resource.resource && typeof resource.resource.finalize === 'function') {
          resource.resource.finalize()
        }
        break
      case 'buffer':
      case 'texture':
      case 'framebuffer':
        // These are handled by deck.gl internally
        break
    }
  }
  
  /**
   * Cleanup all resources
   */
  cleanupAll() {
    this.resources.forEach(resource => {
      this.cleanupResource(resource)
    })
    this.resources.clear()
  }
  
  /**
   * Get memory usage stats
   */
  getStats() {
    const totalBytes = this.getCurrentUsage()
    const resourceCount = this.resources.size
    const resourcesByType = new Map<string, number>()
    
    this.resources.forEach(resource => {
      const count = resourcesByType.get(resource.type) || 0
      resourcesByType.set(resource.type, count + 1)
    })
    
    return {
      totalMB: totalBytes / (1024 * 1024),
      maxMB: this.maxMemoryMB,
      usagePercent: (totalBytes / (this.maxMemoryMB * 1024 * 1024)) * 100,
      resourceCount,
      resourcesByType: Object.fromEntries(resourcesByType)
    }
  }
  
  /**
   * Set memory limit
   */
  setMemoryLimit(limitMB: number) {
    this.maxMemoryMB = limitMB
  }
}

// Global instance
export const webglMemoryManager = new WebGLMemoryManager()

/**
 * Estimate memory usage for a data array
 */
export function estimateDataMemory(dataCount: number, bytesPerPoint: number = 32): number {
  // Estimate: position (2 * 4 bytes) + color (4 bytes) + radius (4 bytes) + padding
  return dataCount * bytesPerPoint
}

/**
 * Check if WebGL has enough memory for data
 */
export function canHandleDataSize(dataCount: number): boolean {
  const estimatedMemory = estimateDataMemory(dataCount)
  const currentUsage = webglMemoryManager.getCurrentUsage()
  const stats = webglMemoryManager.getStats()
  
  return (currentUsage + estimatedMemory) < (stats.maxMB * 1024 * 1024 * 0.9) // 90% threshold
}