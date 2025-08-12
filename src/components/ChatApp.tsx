import React from 'react'
import { useLMStudio } from '../hooks/useLMStudio'
import ConnectionStatus from './ConnectionStatus'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ModelSelector from './ModelSelector'
import ClearButton from './ClearButton'

// Declarative ChatApp component
const ChatApp: React.FC = () => {
  const {
    state,
    models,
    currentModel,
    isLoadingModels,
    sendMessage,
    clearChat,
    selectModel,
    reconnect,
    canSendMessage,
    hasMessages,
  } = useLMStudio()

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      <ConnectionStatus
        isConnected={state.isConnected}
        error={state.error}
        onReconnect={reconnect}
      />

      {state.isConnected && (
        <div className='px-6 py-3 bg-white border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <ModelSelector
              models={models}
              currentModel={currentModel}
              onModelSelect={selectModel}
              isLoading={isLoadingModels}
              disabled={state.isLoading}
            />

            {hasMessages && (
              <ClearButton onClick={clearChat} disabled={state.isLoading} />
            )}
          </div>
        </div>
      )}

      <MessageList messages={state.messages} />

      <MessageInput onSend={sendMessage} disabled={!canSendMessage} />
    </div>
  )
}

export default ChatApp
