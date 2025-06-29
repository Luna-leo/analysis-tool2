/**
 * requestIdleCallback polyfill for browsers that don't support it
 */

type IdleDeadline = {
  readonly didTimeout: boolean
  timeRemaining: () => number
}

type IdleRequestCallback = (deadline: IdleDeadline) => void

type IdleRequestOptions = {
  timeout?: number
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

// Create a polyfill for requestIdleCallback
const requestIdleCallbackPolyfill = (
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number => {
  if (!isBrowser) {
    // In SSR, execute callback immediately
    callback({
      didTimeout: false,
      timeRemaining: () => 0
    })
    return 0
  }
  
  const start = Date.now()
  return window.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
    })
  }, options?.timeout || 1)
}

const cancelIdleCallbackPolyfill = (handle: number): void => {
  if (isBrowser) {
    window.clearTimeout(handle)
  }
}

// Export the appropriate function based on browser support
export const requestIdleCallback: (
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
) => number = 
  isBrowser && (window as any).requestIdleCallback 
    ? (window as any).requestIdleCallback 
    : requestIdleCallbackPolyfill

export const cancelIdleCallback: (handle: number) => void = 
  isBrowser && (window as any).cancelIdleCallback 
    ? (window as any).cancelIdleCallback 
    : cancelIdleCallbackPolyfill

/**
 * Priority levels for idle tasks
 */
export enum IdleTaskPriority {
  HIGH = 1,
  NORMAL = 2,
  LOW = 3
}

/**
 * Queue for managing idle tasks with priority
 */
export class IdleTaskQueue {
  private tasks: Map<IdleTaskPriority, Array<() => void>> = new Map([
    [IdleTaskPriority.HIGH, []],
    [IdleTaskPriority.NORMAL, []],
    [IdleTaskPriority.LOW, []]
  ])
  private isProcessing = false
  private idleCallbackId: number | null = null

  addTask(task: () => void, priority: IdleTaskPriority = IdleTaskPriority.NORMAL) {
    if (!isBrowser) {
      // Execute immediately in SSR
      try {
        task()
      } catch (error) {
        console.error('Error in idle task:', error)
      }
      return
    }
    
    const taskList = this.tasks.get(priority)!
    taskList.push(task)
    
    if (!this.isProcessing) {
      this.scheduleProcessing()
    }
  }

  private scheduleProcessing() {
    if (!isBrowser) return
    
    if (this.idleCallbackId !== null) {
      cancelIdleCallback(this.idleCallbackId)
    }

    this.idleCallbackId = requestIdleCallback((deadline) => {
      this.processTasks(deadline)
    }, { timeout: 100 })
  }

  private processTasks(deadline: IdleDeadline) {
    this.isProcessing = true
    
    // Process tasks in priority order
    for (const [priority, taskList] of this.tasks) {
      while (taskList.length > 0 && deadline.timeRemaining() > 0) {
        const task = taskList.shift()!
        try {
          task()
        } catch (error) {
          console.error('Error in idle task:', error)
        }
      }
    }

    // Check if there are more tasks to process
    const hasMoreTasks = Array.from(this.tasks.values()).some(list => list.length > 0)
    
    if (hasMoreTasks) {
      this.scheduleProcessing()
    } else {
      this.isProcessing = false
      this.idleCallbackId = null
    }
  }

  clear() {
    if (isBrowser && this.idleCallbackId !== null) {
      cancelIdleCallback(this.idleCallbackId)
      this.idleCallbackId = null
    }
    
    this.tasks.forEach(taskList => taskList.length = 0)
    this.isProcessing = false
  }
}

// Create a global idle task queue
export const globalIdleTaskQueue = new IdleTaskQueue()