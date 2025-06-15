import { UserSettings } from '@/types/settings'

/**
 * Default user settings used across the application
 */
export const DEFAULT_SETTINGS: UserSettings = {
  toolDefaults: {
    parameterSource: 'master'
  }
} as const

