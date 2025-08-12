/**
 * Custom error types for LM Studio integration
 */

export class LMStudioError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'LMStudioError'
  }
}

export class ConnectionError extends LMStudioError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONNECTION_ERROR', details)
    this.name = 'ConnectionError'
  }
}

export class ModelLoadError extends LMStudioError {
  constructor(message: string, details?: unknown) {
    super(message, 'MODEL_LOAD_ERROR', details)
    this.name = 'ModelLoadError'
  }
}

export class StreamingError extends LMStudioError {
  constructor(message: string, details?: unknown) {
    super(message, 'STREAMING_ERROR', details)
    this.name = 'StreamingError'
  }
}

export const isLMStudioError = (error: unknown): error is LMStudioError => {
  return error instanceof LMStudioError
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error occurred'
}