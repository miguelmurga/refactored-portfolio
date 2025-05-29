/**
 * Production-safe logging utility
 * Automatically disables logs in production unless explicitly enabled
 */

// Check if we're in development mode
const isDev = process.dev || process.env.NODE_ENV === 'development'
const isDebugEnabled = process.env.NUXT_DEBUG_LOGS === 'true'

// Log levels
export const logger = {
  // Always log errors (even in production)
  error: (...args: any[]) => {
    console.error(...args)
  },

  // Warn in dev and production
  warn: (...args: any[]) => {
    console.warn(...args)
  },

  // Info only in development or when debug is enabled
  info: (...args: any[]) => {
    if (isDev || isDebugEnabled) {
      console.log(...args)
    }
  },

  // Debug only in development or when debug is enabled
  debug: (...args: any[]) => {
    if (isDev || isDebugEnabled) {
      console.log(...args)
    }
  },

  // Chat-specific logs (can be toggled independently)
  chat: (...args: any[]) => {
    if (isDev || isDebugEnabled) {
      console.log('[Chat]', ...args)
    }
  },

  // API-specific logs (can be toggled independently)
  api: (...args: any[]) => {
    if (isDev || isDebugEnabled) {
      console.log('[API]', ...args)
    }
  },

  // Filter-specific logs (can be toggled independently)
  filter: (...args: any[]) => {
    if (isDev || isDebugEnabled) {
      console.log('[FILTER]', ...args)
    }
  }
}

// Utility to check if logging is enabled
export const isLoggingEnabled = () => isDev || isDebugEnabled

// Export individual loggers for convenience
export const { error, warn, info, debug, chat, api, filter } = logger