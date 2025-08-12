import React, { useState } from 'react'
import { LLM } from '../services/lmStudioClient'

interface ModelSelectorProps {
  models: LLM[]
  currentModel: string | null
  onModelSelect: (modelId: string) => void
  isLoading?: boolean
  disabled?: boolean
}

// Declarative model selector component
const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  currentModel,
  onModelSelect,
  isLoading = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (modelId: string) => {
    onModelSelect(modelId)
    setIsOpen(false)
  }

  // No models available state
  if (models.length === 0 && !isLoading) {
    return (
      <div className='text-sm text-gray-500'>
        No models loaded. Please load a model in LM Studio's interface first.
      </div>
    )
  }

  // Loading state text
  const displayText = isLoading
    ? 'Loading models...'
    : currentModel
    ? `Model: ${
        models.find((m) => m.identifier === currentModel)?.displayName ||
        currentModel
      }`
    : 'Select a model'

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className='flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'>
        <span className='truncate font-medium'>{displayText}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && !disabled && !isLoading && (
        <ModelDropdown
          models={models}
          currentModel={currentModel}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}

// Chevron icon component
const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <svg
    className={`w-4 h-4 ml-2 transition-transform ${
      isOpen ? 'rotate-180' : ''
    }`}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M19 9l-7 7-7-7'
    />
  </svg>
)

// Model dropdown component
const ModelDropdown: React.FC<{
  models: LLM[]
  currentModel: string | null
  onSelect: (modelId: string) => void
}> = ({ models, currentModel, onSelect }) => (
  <div className='absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg'>
    <div className='max-h-60 overflow-auto'>
      {models.map((model) => (
        <ModelOption
          key={model.identifier}
          model={model}
          isSelected={model.identifier === currentModel}
          onSelect={() => onSelect(model.identifier)}
        />
      ))}
    </div>
  </div>
)

// Model option component
const ModelOption: React.FC<{
  model: LLM
  isSelected: boolean
  onSelect: () => void
}> = ({ model, isSelected, onSelect }) => (
  <button
    onClick={onSelect}
    className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:outline-none focus:bg-blue-50 ${
      isSelected ? 'bg-blue-100 font-medium' : ''
    }`}>
    <div className='flex items-center justify-between'>
      <span className='truncate'>{model.displayName}</span>
      {isSelected && <CheckIcon />}
    </div>
    <div className='text-xs text-gray-500 truncate'>{model.path}</div>
  </button>
)

// Check icon component
const CheckIcon: React.FC = () => (
  <svg
    className='w-4 h-4 text-blue-600'
    fill='currentColor'
    viewBox='0 0 20 20'>
    <path
      fillRule='evenodd'
      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
      clipRule='evenodd'
    />
  </svg>
)

export default ModelSelector
