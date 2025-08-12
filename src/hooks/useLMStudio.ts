import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  LLM,
  LMStudioConnection,
  createConnection,
  listModels,
  loadModel,
  streamChat,
  hasLoadedModel,
} from '../services/lmStudioClient'
import { ChatMessage, ChatState } from '../types/chat'
import {
  isLMStudioError,
  getErrorMessage,
  ConnectionError,
  ModelLoadError,
} from '../types/errors'
import { ERROR_MESSAGES } from '../constants/lmstudio'

/**
 * Custom hook for LM Studio connection and chat management
 * Provides a declarative interface for AI chat functionality
 */
export const useLMStudio = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isConnected: false,
    isLoading: false,
    error: null,
  })

  const [connection, setConnection] = useState<LMStudioConnection | null>(null)
  const [models, setModels] = useState<readonly LLM[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  // Use ref to store the AI message ID to avoid closure issues
  const currentAiMessageId = useRef<string | null>(null)

  // Load available models
  const loadAvailableModels = useCallback(async (conn: LMStudioConnection) => {
    setIsLoadingModels(true)

    try {
      const availableModels = await listModels(conn)
      setModels(availableModels)

      // Auto-select first model if available
      if (availableModels.length > 0 && !conn.modelId) {
        const firstModel = availableModels[0].identifier
        try {
          const updatedConnection = await loadModel(conn, firstModel)
          setConnection(updatedConnection)
        } catch (error) {
          console.error('Failed to auto-load first model:', error)
        }
      }
    } catch (error) {
      setModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }, [])

  // Connection effect
  useEffect(() => {
    let mounted = true

    const connect = async () => {
      if (!mounted) return

      setState((prev) => ({ ...prev, error: null, isLoading: true }))

      try {
        const newConnection = await createConnection()
        if (!mounted) return

        setConnection(newConnection)
        setState((prev) => ({
          ...prev,
          isConnected: true,
          error: null,
          isLoading: false,
        }))

        await loadAvailableModels(newConnection)
      } catch (error) {
        if (!mounted) return

        const errorMessage = error instanceof ConnectionError
          ? error.message
          : getErrorMessage(error)

        setState((prev) => ({
          ...prev,
          isConnected: false,
          error: errorMessage,
          isLoading: false,
        }))
      }
    }

    connect()

    return () => {
      mounted = false
    }
  }, [loadAvailableModels])

  // Select a model
  const selectModel = useCallback(async (modelId: string) => {
    if (!connection) return

    try {
      setState((prev) => ({ ...prev, error: null }))
      const updatedConnection = await loadModel(connection, modelId)
      setConnection(updatedConnection)
    } catch (error) {
      const errorMessage = error instanceof ModelLoadError
        ? error.message
        : `Failed to load model: ${getErrorMessage(error)}`

      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }))
    }
  }, [connection])

  // Clear chat messages
  const clearChat = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      error: null,
    }))
    currentAiMessageId.current = null
  }, [])

  // Send a message and handle streaming response
  const sendMessage = useCallback(
    async (text: string) => {
      if (!connection || !hasLoadedModel(connection)) {
        return
      }

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date(),
        isStreaming: false,
      }

      const aiMessageId = crypto.randomUUID()
      currentAiMessageId.current = aiMessageId

      const aiMessage: ChatMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      }

      // Add messages to state
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage, aiMessage],
        isLoading: true,
        error: null,
      }))

      try {
        let fullResponse = ''

        await streamChat(connection.model, text, (chunk) => {
          fullResponse += chunk

          // Update AI message content
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: fullResponse }
                : msg
            ),
          }))
        })

        // Mark streaming complete
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, isStreaming: false }
              : msg
          ),
          isLoading: false,
        }))
      } catch (error) {
        const errorMessage = isLMStudioError(error)
          ? ERROR_MESSAGES.STREAMING_FAILED
          : ERROR_MESSAGES.GENERIC_ERROR

        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  content: errorMessage,
                  isStreaming: false,
                }
              : msg
          ),
          isLoading: false,
          error: ERROR_MESSAGES.STREAMING_FAILED,
        }))
      } finally {
        currentAiMessageId.current = null
      }
    },
    [connection]
  )

  // Reconnect function
  const reconnect = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null, isLoading: true }))

    try {
      const newConnection = await createConnection()
      setConnection(newConnection)
      setState((prev) => ({
        ...prev,
        isConnected: true,
        error: null,
        isLoading: false,
      }))

      await loadAvailableModels(newConnection)
    } catch (error) {
      const errorMessage = error instanceof ConnectionError
        ? error.message
        : getErrorMessage(error)

      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: errorMessage,
        isLoading: false,
      }))
    }
  }, [loadAvailableModels])

  // Memoize computed values
  const canSendMessage = useMemo(
    () =>
      state.isConnected &&
      !state.isLoading &&
      connection !== null &&
      hasLoadedModel(connection),
    [state.isConnected, state.isLoading, connection]
  )

  const hasMessages = useMemo(
    () => state.messages.length > 0,
    [state.messages.length]
  )

  const currentModel = useMemo(
    () => connection?.modelId || null,
    [connection?.modelId]
  )

  return {
    // State
    state,
    models,
    currentModel,
    isLoadingModels,

    // Actions
    sendMessage,
    clearChat,
    selectModel,
    reconnect,

    // Computed values
    canSendMessage,
    hasMessages,
  }
}