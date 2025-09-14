'use client'

import { useState, useEffect } from 'react'

interface UploadProgressBarProps {
  isVisible: boolean
  progress: number
  message: string
  onComplete?: () => void
}

export default function UploadProgressBar({ 
  isVisible, 
  progress, 
  message, 
  onComplete 
}: UploadProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    if (isVisible) {
      setDisplayProgress(0)
      const interval = setInterval(() => {
        setDisplayProgress(prev => {
          if (prev >= progress) {
            clearInterval(interval)
            if (progress >= 100 && onComplete) {
              setTimeout(onComplete, 500) // Delay completion callback
            }
            return progress
          }
          return prev + 2 // Smooth animation
        })
      }, 50)
      
      return () => clearInterval(interval)
    }
  }, [isVisible, progress, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Uploading Image
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            {message}
          </p>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
          
          <p className="text-xs text-gray-500">
            {Math.round(displayProgress)}%
          </p>
        </div>
      </div>
    </div>
  )
}
