/**
 * Constants for LM Studio integration
 */

export const LM_STUDIO_CONFIG = {
  WS_URL: 'ws://localhost:1234',
  DEFAULT_MODEL: 'google/gemma-3n-e4b',
  CONNECTION_TIMEOUT: 5000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const

export const ERROR_MESSAGES = {
  CONNECTION_REFUSED: 'Failed to connect to LM Studio.',
  NO_MODELS: 'No models loaded. Please load a model in LM Studio\'s interface first.',
  MODEL_NOT_FOUND: 'Model not found. Please load this model in LM Studio first.',
  STREAMING_FAILED: 'Failed to get response. Please check your connection.',
  GENERIC_ERROR: 'Sorry, I encountered an error. Please try again.',
} as const

export const CONNECTION_HELP = `Please ensure:
1. LM Studio is running
2. The local server is enabled in LM Studio settings
3. The model "${LM_STUDIO_CONFIG.DEFAULT_MODEL}" is loaded`