'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface CancellationReasonModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  title: string
  bookingDetails?: {
    customerName: string
    customerPhone: string
    groundName?: string
    date: string
    time: string
  }
  loading?: boolean
}

const CANCELLATION_REASON_OPTIONS = [
  'Ground maintenance required',
  'Weather conditions',
  'Equipment unavailable',
  'Double booking',
  'Customer request',
  'Payment issue',
  'Ground owner unavailable',
  'Technical problem',
  'Other'
]

export default function CancellationReasonModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  bookingDetails,
  loading = false
}: CancellationReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  if (!isOpen) return null

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason)
    if (reason === 'Other') {
      setShowCustomInput(true)
      setCustomReason('')
    } else {
      setShowCustomInput(false)
      setCustomReason('')
    }
  }

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Other' ? customReason : selectedReason
    if (!finalReason.trim()) {
      return
    }
    onConfirm(finalReason)
  }

  const handleClose = () => {
    setSelectedReason('')
    setCustomReason('')
    setShowCustomInput(false)
    onClose()
  }

  const isConfirmDisabled = !selectedReason || (selectedReason === 'Other' && !customReason.trim()) || loading

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[95vh] overflow-y-auto"> {/* Changed max-h-[90vh] to max-h-[95vh] */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-600">Provide a reason for cancelling this booking</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Booking Details */}
          {bookingDetails && (
            <div className="mb-6 p-1 bg-gray-50 rounded-lg">
              {/* <h3 className="text-sm font-medium text-gray-900 mb-2">Booking Details</h3> */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                <p><strong>Customer:</strong> {bookingDetails.customerName}</p>
                <p><strong>Phone:</strong> {bookingDetails.customerPhone}</p>
                {bookingDetails.groundName && (
                  <p><strong>Ground:</strong> {bookingDetails.groundName}</p>
                )}
                <p><strong>Date:</strong> {bookingDetails.date}</p>
                <p><strong>Time:</strong> {bookingDetails.time}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            {/* <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action will cancel the booking and send SMS notifications to the customer.
              </p>
            </div> */}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Cancellation Reason *
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {CANCELLATION_REASON_OPTIONS.map((reason) => (
                  <label key={reason} className="flex items-start">
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => handleReasonSelect(e.target.value)}
                      disabled={loading}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 mt-0.5"
                    />
                    <span className="ml-2 text-sm text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>

              {showCustomInput && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Reason *
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    placeholder="Please specify the reason..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cancelling...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
