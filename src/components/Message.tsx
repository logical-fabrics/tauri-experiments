import React from 'react'
import { ChatMessage } from '../types/chat'

interface MessageProps {
  message: ChatMessage
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`
        max-w-[70%] px-4 py-3 rounded-lg
        ${
          isUser
            ? 'bg-blue-600 text-white ml-12'
            : 'bg-white border border-gray-200 shadow-sm mr-12'
        }
        ${message.isStreaming ? 'relative' : ''}
      `}>
        <div className='flex items-start space-x-2'>
          <p className='whitespace-pre-wrap break-words flex-1'>
            {message.content}
            {message.isStreaming && message.content && (
              <span className='inline-block w-2 h-4 bg-gray-400 animate-blink ml-1 align-middle' />
            )}
          </p>
        </div>
        {message.isStreaming && !message.content && (
          <div className='flex space-x-1'>
            <span
              className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
              style={{ animationDelay: '0ms' }}
            />
            <span
              className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
              style={{ animationDelay: '150ms' }}
            />
            <span
              className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
              style={{ animationDelay: '300ms' }}
            />
          </div>
        )}
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-400'
          }`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

export default Message
