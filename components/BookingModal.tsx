'use client'

import { useState } from 'react'
import { X, Calendar, Clock, User, Phone } from 'lucide-react'
import { formatPrice, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  ground: {
    id: string
    name: string
    morningPrice: number
    eveningPrice: number
  }
  selectedDate: string
  selectedTime: string
  selectedEndTime: string
}

export default function BookingModal({
  isOpen,
  onClose,
  ground,
  selectedDate,
  selectedTime,
  selectedEndTime
}: BookingModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: ''
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const price = selectedTime < '12:00' ? ground.morningPrice : ground.eveningPrice

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    // Validate Sri Lankan phone number
    const phoneRegex = /^(0|94)[0-9]{9}$/
    if (!phoneRegex.test(formData.customerPhone)) {
      toast.error('Please enter a valid Sri Lankan phone number (e.g., 0773078103 or +94773078103)')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          groundId: ground.id,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          date: selectedDate,
          startTime: selectedTime,
          endTime: selectedEndTime
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Booking confirmed! You will receive a confirmation SMS shortly.')
        onClose()
        setFormData({ customerName: '', customerPhone: '' })
      } else {
        toast.error(data.error || 'Failed to submit booking')
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to submit booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-sm sm:max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Book Ground</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">{ground.name}</h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span>{new Date(selectedDate).toLocaleDateString('en-LK', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span>{formatTime(selectedTime)} - {formatTime(selectedEndTime)}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-base sm:text-lg text-primary-600">
                  {formatPrice(price)}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                <User className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                Full Name
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                placeholder="Enter your phone number (e.g., 0773078103)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your Sri Lankan phone number (10 digits starting with 0)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:flex-1 px-4 py-2 sm:py-3 bg-primary-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
