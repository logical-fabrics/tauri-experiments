import React from 'react'

interface ClearButtonProps {
  onClick: () => void
  disabled?: boolean
}

// Declarative clear button component
const ClearButton: React.FC<ClearButtonProps> = ({
  onClick,
  disabled = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
    Clear Chat
  </button>
)

export default ClearButton
