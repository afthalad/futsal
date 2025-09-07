'use client'

import { useEffect, useState } from 'react'

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0
  })

  useEffect(() => {
    const startTime = performance.now()
    
    // Monitor page load time
    const handleLoad = () => {
      const loadTime = performance.now() - startTime
      setMetrics(prev => ({ ...prev, loadTime }))
    }

    // Monitor API calls
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      setMetrics(prev => ({ ...prev, apiCalls: prev.apiCalls + 1 }))
      return originalFetch(...args)
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
    }

    return () => {
      window.removeEventListener('load', handleLoad)
      window.fetch = originalFetch
    }
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div>Load: {metrics.loadTime.toFixed(0)}ms</div>
      <div>API Calls: {metrics.apiCalls}</div>
    </div>
  )
}
