import { useState, useCallback } from 'react'
import {
  LMStudioConnection,
  createConnection,
} from '../services/lmStudioClient'
import {
  ConnectionError,
  getErrorMessage,
} from '../types/errors'

/**
 * Hook for managing LM Studio connection
 */
export const useConnection = () => {
  const [connection, setConnection] = useState<LMStudioConnection | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setConnectionError(null)

    try {
      const newConnection = await createConnection()
      setConnection(newConnection)
      return newConnection
    } catch (error) {
      const errorMessage = error instanceof ConnectionError
        ? error.message
        : getErrorMessage(error)
      
      setConnectionError(errorMessage)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setConnection(null)
    setConnectionError(null)
  }, [])

  return {
    connection,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    setConnection,
  }
}