'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Calendar, Clock, User, Phone, AlertCircle, X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { formatTime, formatFirebaseDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  groundId: string
  customerName: string
  customerPhone: string
  date: string
  startTime: string
  endTime: string
  price: number
  reason?: string
  status?: string
  ground: {
    id: string
    name: string
    location: string
    city: string
    morningPrice: number
    eveningPrice: number
  }
  createdAt: any
  updatedAt: any
}

interface Ground {
  id: string
  name: string
  location: string
  city: string
  morningPrice: number
  eveningPrice: number
  nightPrice: number
}

export default function EditBookingPage() {
  const router = useRouter()
  const params = useParams()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [grounds, setGrounds] = useState<Ground[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    date: '',
    startTime: '',
    endTime: '',
    groundId: '',
    price: 0
  })

  useEffect(() => {
    checkAuth()
    if (params.id) {
      fetchBooking()
      fetchGrounds()
    }
  }, [params.id])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        localStorage.removeItem('token')
        router.push('/auth/login')
        return
      }

      const data = await response.json()
      if (data.user.role !== 'SUPER_ADMIN') {
        router.push('/')
        return
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/auth/login')
    }
  }

  const fetchBooking = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/bookings/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBooking(data.booking)
        setFormData({
          customerName: data.booking.customerName || '',
          customerPhone: data.booking.customerPhone || '',
          date: data.booking.date || '',
          startTime: data.booking.startTime || '',
          endTime: data.booking.endTime || '',
          groundId: data.booking.groundId || '',
          price: data.booking.price || 0
        })
      } else {
        toast.error('Failed to load booking details')
        router.push('/admin/super')
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      toast.error('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const fetchGrounds = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/grounds', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGrounds(data.grounds)
      }
    } catch (error) {
      console.error('Error fetching grounds:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerName.trim() || !formData.customerPhone.trim() || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate Sri Lankan phone number
    const phoneRegex = /^(0|94)[0-9]{9}$/
    if (!phoneRegex.test(formData.customerPhone)) {
      toast.error('Please enter a valid Sri Lankan phone number (e.g., 0773078103)')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/bookings/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Booking updated successfully')
        router.push('/admin/super')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update booking')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('Failed to update booking')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation')
      return
    }

    try {
      setCancelling(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/bookings/${params.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: cancelReason })
      })

      if (response.ok) {
        toast.success('Booking cancelled successfully. SMS notifications sent to customer and ground owner.')
        router.push('/admin/super')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to cancel booking')
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-calculate price when ground or time changes
    if (name === 'groundId' || name === 'startTime') {
      const selectedGround = grounds.find(g => g.id === value)
      if (selectedGround && formData.startTime) {
        const hour = parseInt(formData.startTime.split(':')[0])
        const isMorning = hour >= 0 && hour < 12
        const price = isMorning ? selectedGround.morningPrice : selectedGround.eveningPrice
        setFormData(prev => ({ ...prev, price }))
      }
    }
  }

  const selectedGround = grounds.find(g => g.id === formData.groundId)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Booking not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/admin/super')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Booking</h1>
                <p className="text-gray-600">Update booking information and manage cancellation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Status Alert */}
        {booking.status === 'CANCELLED' || booking.status === 'cancelled' ? (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">This booking has been cancelled</h3>
                <p className="text-sm text-red-700">
                  {booking.reason && `Reason: ${booking.reason}`}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0773078103"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter Sri Lankan phone number (10 digits starting with 0)
                </p>
              </div>

              {/* Ground Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ground *
                </label>
                <select
                  name="groundId"
                  value={formData.groundId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select a ground</option>
                  {grounds.map((ground) => (
                    <option key={ground.id} value={ground.id}>
                      {ground.name} - {ground.location}, {ground.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Start Time *
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  End Time *
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (LKR)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                  step="100"
                />
                {selectedGround && (
                  <p className="text-xs text-gray-500 mt-1">
                    Morning: Rs. {selectedGround.morningPrice.toLocaleString()} | 
                    Evening: Rs. {selectedGround.eveningPrice.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Booking Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Booking Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Booking ID:</span> {booking.id}
                </div>
                <div>
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                    booking.status === 'CANCELLED' || booking.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {booking.status === 'CANCELLED' || booking.status === 'cancelled' ? 'Cancelled' : 'Active'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Created:</span> {formatFirebaseDate(booking.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span> {formatFirebaseDate(booking.updatedAt)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/admin/super')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                {booking.status !== 'CANCELLED' && booking.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel Booking
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={saving || booking.status === 'CANCELLED' || booking.status === 'cancelled'}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Booking</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Customer:</strong> {booking.customerName}</p>
                <p><strong>Phone:</strong> {booking.customerPhone}</p>
                <p><strong>Ground:</strong> {booking.ground?.name}</p>
                <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString('en-LK')}</p>
                <p><strong>Time:</strong> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={cancelling}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
                placeholder="Please provide a reason for cancelling this booking..."
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling || !cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {cancelling && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
