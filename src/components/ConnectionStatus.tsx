import React from 'react'

interface ConnectionStatusProps {
  isConnected: boolean
  error?: string | null
  onReconnect?: () => void
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  error,
  onReconnect,
}) => {
  return (
    <div className='bg-white border-b border-gray-200 px-6 py-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <h1 className='text-xl font-semibold text-gray-800'>AI Chat</h1>
        </div>
        <div className='flex items-center space-x-2'>
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span
            className={`text-sm ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
            {isConnected ? 'Connected to LM Studio' : 'Disconnected'}
          </span>
          {!isConnected && onReconnect && (
            <button
              onClick={onReconnect}
              className='ml-2 text-sm text-blue-600 hover:text-blue-700 underline'>
              Reconnect
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className='mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded'>
          {error}
        </div>
      )}
    </div>
  )
}

export default ConnectionStatus
