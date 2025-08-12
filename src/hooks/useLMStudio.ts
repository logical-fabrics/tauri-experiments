import { useState, useEffect, useCallback } from 'react';
import lmStudioClient, { LLM } from '../services/lmStudioClient';
import { ChatMessage, ChatState } from '../types/chat';

// Custom hook for LM Studio connection and chat management
export const useLMStudio = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isConnected: false,
    isLoading: false,
    error: null
  });
  
  const [models, setModels] = useState<LLM[]>([]);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Connection effect
  useEffect(() => {
    const connect = async () => {
      setState(prev => ({ ...prev, error: null, isLoading: true }));
      
      try {
        await lmStudioClient.connect();
        setState(prev => ({ 
          ...prev, 
          isConnected: true,
          error: null,
          isLoading: false
        }));
        
        // Load models after successful connection
        await loadModels();
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
  const loadModels = async () => {
    setIsLoadingModels(true);
    
    try {
      const availableModels = await lmStudioClient.getAvailableModels();
      setModels(availableModels);
      
      // Auto-select first model if available
      if (availableModels.length > 0 && !currentModel) {
        const firstModel = availableModels[0].identifier;
        await selectModel(firstModel);
      }
    } catch (error) {
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Select a model
  const selectModel = async (modelId: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await lmStudioClient.loadModel(modelId);
      setCurrentModel(modelId);
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
      
      await lmStudioClient.streamChat(text, (chunk) => {
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
  }, []);

  // Reconnect function
  const reconnect = async () => {
    setState(prev => ({ ...prev, error: null, isLoading: true }));
    
    try {
      await lmStudioClient.connect();
      setState(prev => ({ 
        ...prev, 
        isConnected: true,
        error: null,
        isLoading: false
      }));
      
      await loadModels();
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
    currentModel,
    isLoadingModels,
    
    // Actions
    sendMessage,
    clearChat,
    selectModel,
    reconnect,
    
    // Computed values
    canSendMessage: state.isConnected && !state.isLoading && !!currentModel,
    hasMessages: state.messages.length > 0
  };
};