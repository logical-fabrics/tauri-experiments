import { useEffect, useCallback, useMemo } from 'react'
import { hasLoadedModel } from '../services/lmStudioClient'
import { useConnection } from './useConnection'
import { useModels } from './useModels'
import { useChat } from './useChat'
import { ChatState } from '../types/chat'

/**
 * Main hook that orchestrates LM Studio functionality
 * Composes smaller hooks for better modularity and maintainability
 */
export const useLMStudio = () => {
  const connectionHook = useConnection()
  const { connection, isConnecting, connectionError, connect, disconnect } = connectionHook

  const {
    models,
    isLoadingModels,
    modelError,
    loadAvailableModels,
    selectModel,
    currentModel,
  } = useModels(connection, connectionHook.setConnection)

  const {
    messages,
    isLoading: isChatLoading,
    chatError,
    sendMessage,
    clearChat,
    hasMessages,
  } = useChat(connection)

  // Initialize connection on mount
  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      try {
        const newConnection = await connect()
        if (mounted && newConnection) {
          await loadAvailableModels(newConnection)
        }
      } catch (error) {
        // Error is already handled in the connect function
        console.error('Failed to initialize:', error)
      }
    }

    initialize()

    return () => {
      mounted = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reconnect function
  const reconnect = useCallback(async () => {
    try {
      const newConnection = await connect()
      if (newConnection) {
        await loadAvailableModels(newConnection)
      }
    } catch (error) {
      // Error is already handled in the connect function
      console.error('Failed to reconnect:', error)
    }
  }, [connect, loadAvailableModels])

  // Combine all error states
  const error = connectionError || modelError || chatError

  // Create combined state object for backward compatibility
  const state: ChatState = useMemo(
    () => ({
      messages,
      isConnected: !!connection && !isConnecting,
      isLoading: isChatLoading || isConnecting,
      error,
    }),
    [messages, connection, isConnecting, isChatLoading, error]
  )

  // Compute canSendMessage
  const canSendMessage = useMemo(
    () =>
      !!connection &&
      !isConnecting &&
      !isChatLoading &&
      hasLoadedModel(connection),
    [connection, isConnecting, isChatLoading]
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
    disconnect,

    // Computed values
    canSendMessage,
    hasMessages,
  }
}