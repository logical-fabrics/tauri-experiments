import { useState, useCallback } from 'react'
import {
  LLM,
  LMStudioConnection,
  listModels,
  loadModel,
} from '../services/lmStudioClient'
import {
  ModelLoadError,
  getErrorMessage,
} from '../types/errors'

/**
 * Hook for managing LM Studio models
 */
export const useModels = (
  connection: LMStudioConnection | null,
  onConnectionUpdate: (conn: LMStudioConnection) => void
) => {
  const [models, setModels] = useState<readonly LLM[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)

  const loadAvailableModels = useCallback(async (conn: LMStudioConnection) => {
    setIsLoadingModels(true)
    setModelError(null)

    try {
      const availableModels = await listModels(conn)
      setModels(availableModels)

      // Auto-select first model if available
      if (availableModels.length > 0 && !conn.modelId) {
        const firstModel = availableModels[0].identifier
        try {
          const updatedConnection = await loadModel(conn, firstModel)
          onConnectionUpdate(updatedConnection)
        } catch (error) {
          console.error('Failed to auto-load first model:', error)
        }
      }

      return availableModels
    } catch (error) {
      setModels([])
      setModelError(getErrorMessage(error))
      return []
    } finally {
      setIsLoadingModels(false)
    }
  }, [onConnectionUpdate])

  const selectModel = useCallback(async (modelId: string) => {
    if (!connection) return

    setModelError(null)
    
    try {
      const updatedConnection = await loadModel(connection, modelId)
      onConnectionUpdate(updatedConnection)
    } catch (error) {
      const errorMessage = error instanceof ModelLoadError
        ? error.message
        : `Failed to load model: ${getErrorMessage(error)}`
      
      setModelError(errorMessage)
      throw error
    }
  }, [connection, onConnectionUpdate])

  return {
    models,
    isLoadingModels,
    modelError,
    loadAvailableModels,
    selectModel,
    currentModel: connection?.modelId || null,
  }
}