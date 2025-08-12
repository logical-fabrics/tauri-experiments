import { useState, useEffect, useCallback } from 'react';
import { 
  LLM, 
  LMStudioConnection,
  createConnection,
  listModels,
  loadModel,
  streamChat,
  hasLoadedModel
} from '../services/lmStudioClient';
import { ChatMessage, ChatState } from '../types/chat';

// Custom hook for LM Studio connection and chat management
export const useLMStudio = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isConnected: false,
    isLoading: false,
    error: null
  });
  
  const [connection, setConnection] = useState<LMStudioConnection | null>(null);
  const [models, setModels] = useState<LLM[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Connection effect
  useEffect(() => {
    const connect = async () => {
      setState(prev => ({ ...prev, error: null, isLoading: true }));
      
      try {
        const newConnection = await createConnection();
        setConnection(newConnection);
        setState(prev => ({ 
          ...prev, 
          isConnected: true,
          error: null,
          isLoading: false
        }));
        
        // Load models after successful connection
        await loadAvailableModels(newConnection);
      } catch (error: any) {
        setState(prev => ({ 
          ...prev, 
          isConnected: false,
          error: error.message || 'Failed to connect to LM Studio',
          isLoading: false
        }));
      }
    };
    
    connect();
  }, []);

  // Load available models
  const loadAvailableModels = async (conn: LMStudioConnection) => {
    setIsLoadingModels(true);
    
    try {
      const availableModels = await listModels(conn);
      setModels(availableModels);
      
      // Auto-select first model if available
      if (availableModels.length > 0 && !conn.modelId) {
        const firstModel = availableModels[0].identifier;
        // Load model directly with the connection we have
        try {
          const updatedConnection = await loadModel(conn, firstModel);
          setConnection(updatedConnection);
        } catch (error: any) {
          console.error('Failed to auto-load first model:', error);
        }
      }
    } catch (error) {
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Select a model
  const selectModel = async (modelId: string) => {
    if (!connection) {
      // Connection not established yet - shouldn't happen in normal flow
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      const updatedConnection = await loadModel(connection, modelId);
      setConnection(updatedConnection);
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: `Failed to load model: ${error.message}`
      }));
    }
  };

  // Clear chat messages
  const clearChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null
    }));
  }, []);

  // Send a message and handle streaming response
  const sendMessage = useCallback(async (text: string) => {
    if (!connection || !hasLoadedModel(connection)) {
      // Don't set error state - just silently return
      // The UI already shows model selection state
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      isStreaming: false
    };

    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    // Add messages to state
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, aiMessage],
      isLoading: true,
      error: null
    }));

    try {
      let fullResponse = '';
      
      await streamChat(connection.model, text, (chunk) => {
        fullResponse += chunk;
        
        // Update AI message content
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, content: fullResponse }
              : msg
          )
        }));
      });

      // Mark streaming complete
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, isStreaming: false }
            : msg
        ),
        isLoading: false
      }));
    } catch (error) {
      // Handle error
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === aiMessage.id 
            ? { 
                ...msg, 
                content: 'Sorry, I encountered an error. Please try again.', 
                isStreaming: false 
              }
            : msg
        ),
        isLoading: false,
        error: 'Failed to get response. Please check your connection.'
      }));
    }
  }, [connection]);

  // Reconnect function
  const reconnect = async () => {
    setState(prev => ({ ...prev, error: null, isLoading: true }));
    
    try {
      const newConnection = await createConnection();
      setConnection(newConnection);
      setState(prev => ({ 
        ...prev, 
        isConnected: true,
        error: null,
        isLoading: false
      }));
      
      await loadAvailableModels(newConnection);
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isConnected: false,
        error: error.message || 'Failed to connect to LM Studio',
        isLoading: false
      }));
    }
  };

  return {
    // State
    state,
    models,
    currentModel: connection?.modelId || null,
    isLoadingModels,
    
    // Actions
    sendMessage,
    clearChat,
    selectModel,
    reconnect,
    
    // Computed values
    canSendMessage: state.isConnected && !state.isLoading && connection !== null && hasLoadedModel(connection),
    hasMessages: state.messages.length > 0
  };
};