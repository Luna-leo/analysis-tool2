/**
 * Logger utility for debug logging
 * Only outputs in development environment or when explicitly enabled
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  enabled: boolean
  prefix?: string
}

class Logger {
  private config: LoggerConfig

  constructor(config: LoggerConfig = { enabled: false }) {
    this.config = {
      ...config,
      enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === 'true'
    }
  }

  private log(level: LogLevel, ...args: any[]) {
    if (!this.config.enabled) return

    const prefix = this.config.prefix ? `[${this.config.prefix}]` : ''
    const timestamp = new Date().toISOString()
    
    switch (level) {
      case 'debug':
        console.log(`[DEBUG]${prefix}`, ...args)
        break
      case 'info':
        console.info(`[INFO]${prefix}`, ...args)
        break
      case 'warn':
        console.warn(`[WARN]${prefix}`, ...args)
        break
      case 'error':
        console.error(`[ERROR]${prefix}`, ...args)
        break
    }
  }

  debug(...args: any[]) {
    this.log('debug', ...args)
  }

  info(...args: any[]) {
    this.log('info', ...args)
  }

  warn(...args: any[]) {
    this.log('warn', ...args)
  }

  error(...args: any[]) {
    this.log('error', ...args)
  }

  // Create a child logger with a specific prefix
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix
    })
  }
}

// Export default logger instance
export const logger = new Logger()

// Export factory function for creating module-specific loggers
export function createLogger(prefix: string): Logger {
  return logger.child(prefix)
}