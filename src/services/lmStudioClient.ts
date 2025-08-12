import { LMStudioClient, LLM } from '@lmstudio/sdk'

// Re-export LLM type for use in components
export type { LLM } from '@lmstudio/sdk'

// Type definition for connection state
export type LMStudioConnection = {
  client: LMStudioClient
  model: LLM | null
  modelId: string | null
}

// Pure utility function for error messages
export const getDetailedErrorMessage = (error: any): string => {
  const baseMessage = 'Failed to connect to LM Studio. '

  if (
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('fetch failed')
  ) {
    return (
      baseMessage +
      'Please ensure:\n' +
      '1. LM Studio is running\n' +
      '2. The local server is enabled in LM Studio settings\n' +
      '3. The model "google/gemma-3n-e4b" is loaded'
    )
  }

  if (
    error.message?.includes('model') ||
    error.message?.includes('not found')
  ) {
    return (
      baseMessage +
      'Model "google/gemma-3n-e4b" not found. Please load this model in LM Studio first.'
    )
  }

  return baseMessage + (error.message || 'Unknown error occurred')
}

// Create a new connection to LM Studio
export const createConnection = async (): Promise<LMStudioConnection> => {
  try {
    const client = new LMStudioClient({
      baseUrl: 'ws://localhost:1234', // Use WebSocket for browser compatibility
    })
    console.log('Successfully connected to LM Studio!')

    return {
      client,
      model: null,
      modelId: null,
    }
  } catch (error: any) {
    console.error('Failed to connect to LM Studio:', error)
    throw new Error(getDetailedErrorMessage(error))
  }
}

// List available models
export const listModels = async (
  connection: LMStudioConnection
): Promise<LLM[]> => {
  try {
    console.log('Fetching loaded models from LM Studio SDK...')

    const loadedModels = await connection.client.llm.listLoaded()
    console.log('Loaded models:', loadedModels)

    if (!loadedModels || loadedModels.length === 0) {
      console.log('No loaded models found')
      return []
    }

    return loadedModels
  } catch (error: any) {
    console.error('Failed to fetch models from LM Studio:', error)
    return []
  }
}

// Load a specific model - returns updated connection
export const loadModel = async (
  connection: LMStudioConnection,
  modelId: string
): Promise<LMStudioConnection> => {
  try {
    const model = await connection.client.llm.model(modelId)
    console.log(`Loaded model: ${modelId}`)

    // Return new connection state with loaded model
    return {
      ...connection,
      model,
      modelId,
    }
  } catch (error: any) {
    console.error(`Failed to load model ${modelId}:`, error)
    throw new Error(`Failed to load model: ${error.message}`)
  }
}

// Stream chat with the model
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
  } catch (error: any) {
    console.error('Streaming error:', error)
    throw error
  }
}

// Get a complete response from the model
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
  } catch (error: any) {
    console.error('Response error:', error)
    throw error
  }
}

// Helper function to check if connection has a loaded model
export const hasLoadedModel = (
  connection: LMStudioConnection
): connection is LMStudioConnection & { model: LLM; modelId: string } => {
  return connection.model !== null && connection.modelId !== null
}

// Helper function to check if connection is valid
export const isValidConnection = (
  connection: LMStudioConnection | null
): connection is LMStudioConnection => {
  return connection !== null && connection.client !== null
}
