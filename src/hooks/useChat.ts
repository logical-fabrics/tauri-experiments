import { useState, useCallback, useRef } from 'react'
import {
  LLM,
  LMStudioConnection,
  streamChat,
  hasLoadedModel,
} from '../services/lmStudioClient'
import { ChatMessage } from '../types/chat'
import {
  isLMStudioError,
} from '../types/errors'
import { ERROR_MESSAGES } from '../constants/lmstudio'

/**
 * Creates a new user message
 */
const createUserMessage = (text: string): ChatMessage => ({
  id: crypto.randomUUID(),
  role: 'user',
  content: text,
  timestamp: new Date(),
  isStreaming: false,
})

/**
 * Creates a new AI message
 */
const createAIMessage = (id: string): ChatMessage => ({
  id,
  role: 'assistant',
  content: '',
  timestamp: new Date(),
  isStreaming: true,
})

/**
 * Updates a message in the messages array
 */
const updateMessage = (
  messages: ChatMessage[],
  messageId: string,
  updates: Partial<ChatMessage>
): ChatMessage[] => {
  return messages.map((msg) =>
    msg.id === messageId ? { ...msg, ...updates } : msg
  )
}

/**
 * Hook for managing chat messages and interactions
 */
export const useChat = (connection: LMStudioConnection | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  
  // Use ref to store the AI message ID to avoid closure issues
  const currentAiMessageId = useRef<string | null>(null)

  const clearChat = useCallback(() => {
    setMessages([])
    setChatError(null)
    currentAiMessageId.current = null
  }, [])

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const updateMessageContent = useCallback((messageId: string, content: string) => {
    setMessages((prev) => updateMessage(prev, messageId, { content }))
  }, [])

  const finalizeMessage = useCallback((messageId: string) => {
    setMessages((prev) => updateMessage(prev, messageId, { isStreaming: false }))
  }, [])

  const handleStreamingResponse = useCallback(
    async (
      model: LLM,
      text: string,
      aiMessageId: string
    ): Promise<void> => {
      let fullResponse = ''

      await streamChat(model, text, (chunk) => {
        fullResponse += chunk
        updateMessageContent(aiMessageId, fullResponse)
      })

      finalizeMessage(aiMessageId)
    },
    [updateMessageContent, finalizeMessage]
  )

  const handleStreamingError = useCallback(
    (aiMessageId: string, error: unknown) => {
      const errorMessage = isLMStudioError(error)
        ? ERROR_MESSAGES.STREAMING_FAILED
        : ERROR_MESSAGES.GENERIC_ERROR

      setMessages((prev) =>
        updateMessage(prev, aiMessageId, {
          content: errorMessage,
          isStreaming: false,
        })
      )
      
      setChatError(ERROR_MESSAGES.STREAMING_FAILED)
    },
    []
  )

  const sendMessage = useCallback(
    async (text: string) => {
      if (!connection || !hasLoadedModel(connection)) {
        return
      }

      const userMessage = createUserMessage(text)
      const aiMessageId = crypto.randomUUID()
      const aiMessage = createAIMessage(aiMessageId)
      
      currentAiMessageId.current = aiMessageId

      // Add both messages
      addMessage(userMessage)
      addMessage(aiMessage)
      
      setIsLoading(true)
      setChatError(null)

      try {
        await handleStreamingResponse(connection.model, text, aiMessageId)
      } catch (error) {
        handleStreamingError(aiMessageId, error)
      } finally {
        setIsLoading(false)
        currentAiMessageId.current = null
      }
    },
    [connection, addMessage, handleStreamingResponse, handleStreamingError]
  )

  return {
    messages,
    isLoading,
    chatError,
    sendMessage,
    clearChat,
    hasMessages: messages.length > 0,
  }
}