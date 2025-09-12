'use client'

import { useState } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  maxWidth?: string
  className?: string
}

export default function Tooltip({ content, children, maxWidth = 'max-w-xs', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  if (!content || content === '-') {
    return <>{children}</>
  }

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg ${maxWidth} break-words`}
             style={{
               bottom: '100%',
               left: '50%',
               transform: 'translateX(-50%)',
               marginBottom: '8px'
             }}>
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}
