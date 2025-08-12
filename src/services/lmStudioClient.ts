import { LMStudioClient, LLM } from '@lmstudio/sdk'
import {
  ConnectionError,
  ModelLoadError,
  StreamingError,
  getErrorMessage,
} from '../types/errors'
import {
  LM_STUDIO_CONFIG,
  ERROR_MESSAGES,
  CONNECTION_HELP,
} from '../constants/lmstudio'

// Re-export LLM type for use in components
export type { LLM } from '@lmstudio/sdk'

/**
 * Connection state for LM Studio
 */
export type LMStudioConnection = {
  readonly client: LMStudioClient
  readonly model: LLM | null
  readonly modelId: string | null
}

/**
 * Get detailed error message based on error type
 */
export const getDetailedErrorMessage = (error: unknown): string => {
  const errorMessage = getErrorMessage(error)

  if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
    return `${ERROR_MESSAGES.CONNECTION_REFUSED}\n${CONNECTION_HELP}`
  }

  if (errorMessage.includes('model') || errorMessage.includes('not found')) {
    return `${ERROR_MESSAGES.MODEL_NOT_FOUND}`
  }

  return `${ERROR_MESSAGES.CONNECTION_REFUSED} ${errorMessage}`
}

/**
 * Create a new connection to LM Studio
 */
export const createConnection = async (): Promise<LMStudioConnection> => {
  try {
    const client = new LMStudioClient({
      baseUrl: LM_STUDIO_CONFIG.WS_URL,
    })
    console.log('Successfully connected to LM Studio!')

    return Object.freeze({
      client,
      model: null,
      modelId: null,
    })
  } catch (error) {
    console.error('Failed to connect to LM Studio:', error)
    throw new ConnectionError(getDetailedErrorMessage(error), error)
  }
}

/**
 * List available models from LM Studio
 */
export const listModels = async (
  connection: LMStudioConnection
): Promise<readonly LLM[]> => {
  try {
    console.log('Fetching loaded models from LM Studio SDK...')

    const loadedModels = await connection.client.llm.listLoaded()
    console.log('Loaded models:', loadedModels)

    if (!loadedModels || loadedModels.length === 0) {
      console.log('No loaded models found')
      return []
    }

    return Object.freeze(loadedModels)
  } catch (error) {
    console.error('Failed to fetch models from LM Studio:', error)
    return []
  }
}

/**
 * Load a specific model - returns updated connection
 */
export const loadModel = async (
  connection: LMStudioConnection,
  modelId: string
): Promise<LMStudioConnection> => {
  try {
    const model = await connection.client.llm.model(modelId)
    console.log(`Loaded model: ${modelId}`)

    // Return new immutable connection state with loaded model
    return Object.freeze({
      ...connection,
      model,
      modelId,
    })
  } catch (error) {
    console.error(`Failed to load model ${modelId}:`, error)
    throw new ModelLoadError(
      `Failed to load model: ${getErrorMessage(error)}`,
      error
    )
  }
}

/**
 * Stream chat response from the model
 */
export const streamChat = async (
  model: LLM,
  message: string,
  onChunk: (text: string) => void
): Promise<void> => {
  try {
    const prediction = model.respond([
      {
        role: 'user',
        content: message,
      },
    ])

    // Stream the response
    for await (const fragment of prediction) {
      if (fragment.content) {
        onChunk(fragment.content)
      }
    }

    // Wait for completion
    await prediction
  } catch (error) {
    console.error('Streaming error:', error)
    throw new StreamingError(getErrorMessage(error), error)
  }
}

/**
 * Get a complete response from the model
 */
export const getResponse = async (
  model: LLM,
  message: string
): Promise<string> => {
  try {
    const result = await model.respond([
      {
        role: 'user',
        content: message,
      },
    ])
    return result.content
  } catch (error) {
    console.error('Response error:', error)
    throw new StreamingError(getErrorMessage(error), error)
  }
}

/**
 * Type guard to check if connection has a loaded model
 */
export const hasLoadedModel = (
  connection: LMStudioConnection
): connection is LMStudioConnection & { model: LLM; modelId: string } => {
  return connection.model !== null && connection.modelId !== null
}

/**
 * Type guard to check if connection is valid
 */
export const isValidConnection = (
  connection: LMStudioConnection | null
): connection is LMStudioConnection => {
  return connection !== null && connection.client !== null
}