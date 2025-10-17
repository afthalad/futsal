'use client'

import { useState, useEffect } from 'react'
import { DollarSign, AlertCircle, CheckCircle, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { formatFirebaseDate, formatPrice } from '@/lib/utils'

interface Commission {
  id: string
  ownerId: string
  amount: number
  status: 'PENDING' | 'PAID'
  lastUpdated: string
  paidAt?: string
}

export default function GroundOwnerCommission() {
  const [commission, setCommission] = useState<Commission | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    fetchCommission()
    
    // Smart polling: start with 5 seconds, then increase to 30 seconds
    let pollInterval = 5000
    const maxInterval = 30000
    
    const poll = () => {
      fetchCommission()
      // Gradually increase interval up to max
      pollInterval = Math.min(pollInterval * 1.5, maxInterval)
    }
    
    const interval = setInterval(poll, pollInterval)
    
    return () => clearInterval(interval)
  }, [])

  // Detect screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const fetchCommission = async (isManual = false) => {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        return
      }
      
      if (isManual) {
        setRefreshing(true)
      }
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/commission', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCommission(data.commission)
      } else {
        // console.error('Failed to fetch commission')
      }
    } catch (error) {
      // console.error('Error fetching commission:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-amber-600 bg-amber-100'
      case 'PAID':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'PAID':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  // Don't render the component if commission is 0 or null
  if (!commission || commission.amount === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header - Always visible */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Commission Due</h3>
              {/* <p className="text-xs sm:text-xs text-gray-600">Variable commission: 5% (under 500), 3% (500-999), 2% (1000-1999), 1% (2000+)</p> */}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-lg sm:text-lg font-bold text-blue-600">
                {formatPrice(commission?.amount || 0)}
              </div>
              {/* <div className="text-xs sm:text-sm text-gray-600">Due</div> */}
            </div>
            <div className="flex items-center gap-1">
              {/* Only show refresh button on desktop */}
              <button
                onClick={() => fetchCommission(true)}
                disabled={refreshing}
                className="hidden md:block p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="Refresh commission data"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              {/* Only show expand/collapse button on mobile */}
              {isMobile && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title={isExpanded ? "Collapse details" : "Expand details"}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content - Always visible on desktop, expandable on mobile */}
      {(!isMobile || isExpanded) && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
          {commission && commission.amount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    You have a commission payment due
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(commission.status)}`}>
                  {getStatusIcon(commission.status)}
                  {commission.status}
                </span>
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <p>To settle your commission, please transfer the amount to the following bank account. After the transfer, kindly send a receipt or screenshot to <a href="https://wa.me/94773078103" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">0773078103</a> via WhatsApp. Once approved by an admin, your commission balance will be reset to 0.</p>
                <div className="space-y-0.5 mt-5">
                  <p><strong>Bank:</strong> Amana Bank</p>
                  <p><strong>Account No:</strong> 0110508832001</p>
                  <p><strong>Account Name:</strong> Afthal Ahmadh</p>
                </div>
              </div>
            </div>
          )}

          {commission && commission.status === 'PAID' && commission.paidAt && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Last payment received: {formatFirebaseDate(commission.paidAt)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
