import React, { useEffect, useRef } from 'react'
import { ChatMessage } from '../types/chat'
import Message from './Message'

interface MessageListProps {
  messages: ChatMessage[]
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className='flex-1 overflow-y-auto p-6 space-y-2 bg-gray-50'>
      {messages.length === 0 ? (
        <div className='flex items-center justify-center h-full'>
          <div className='text-center'>
            <h2 className='text-2xl font-semibold text-gray-700 mb-2'>
              Welcome to AI Chat
            </h2>
            <p className='text-gray-500'>
              Start a conversation with the AI assistant
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  )
}

export default MessageList
