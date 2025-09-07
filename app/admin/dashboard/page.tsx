'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Eye, Edit, Trash2, Calendar, DollarSign, Users, MapPin, X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { formatPrice, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Ground {
  id: string
  name: string
  location: string
  city: string
  images: string[]
  morningPrice: number
  eveningPrice: number
  isActive: boolean
  _count: {
    bookings: number
  }
}

interface Booking {
  id: string
  customerName: string
  customerPhone: string
  date: string
  startTime: string
  endTime: string
  price: number
  reason?: string
  status?: string
  ground: {
    name: string
  }
}

export default function AdminDashboard() {
  const [grounds, setGrounds] = useState<Ground[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState< 'bookings'|'grounds'>('bookings')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    // Load both grounds and bookings on page load
    fetchGrounds()
    fetchBookings()
  }, [])

  useEffect(() => {
    // Only fetch data when switching tabs if not already loaded
    if (activeTab === 'grounds' && grounds.length === 0) {
      fetchGrounds()
    } else if (activeTab === 'bookings' && bookings.length === 0) {
      fetchBookings()
    }
  }, [activeTab])

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
      if (data.user.role !== 'GROUND_OWNER') {
        router.push('/')
        return
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/auth/login')
    }
  }

  const fetchGrounds = async () => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowCancelModal(true)
  }

  const confirmCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${selectedBooking.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelReason })
      })

      if (response.ok) {
        toast.success('Booking cancelled successfully. Customer will be notified via SMS.')
        
        // Immediately update the booking status in local state
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.id === selectedBooking.id 
              ? { ...booking, status: 'CANCELLED' }
              : booking
          )
        )
        
        setShowCancelModal(false)
        setCancelReason('')
        setSelectedBooking(null)
        
        // Also refresh from server to ensure consistency
        fetchBookings()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to cancel booking')
      }
    } catch (error) {
      console.error('Cancel booking error:', error)
      toast.error('Failed to cancel booking. Please try again.')
    }
  }

  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.price, 0)

  if (loading && grounds.length === 0 && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your futsal grounds and bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Grounds</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{grounds.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Bookings</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {bookings.filter(booking => booking.status !== 'CANCELLED' && booking.status !== 'cancelled').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 px-3 sm:px-6 overflow-x-auto">
             
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'bookings'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bookings
              </button>
              <button
                onClick={() => setActiveTab('grounds')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'grounds'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Grounds
              </button>
            </nav>
          </div>

          <div className="p-3 sm:p-6">
            {activeTab === 'grounds' ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">My Grounds</h2>
                  <button
                    onClick={() => router.push('/admin/grounds/new')}
                    className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Add New Ground
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : grounds.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No grounds yet</h3>
                    <p className="text-gray-600 mb-4">Get started by adding your first futsal ground</p>
                    <button
                      onClick={() => router.push('/admin/grounds/new')}
                      className="btn-primary"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Ground
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grounds.map((ground) => (
                      <div key={ground.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{ground.name}</h3>
                            <p className="text-sm text-gray-600">{ground.location}, {ground.city}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            ground.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {ground.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Morning:</span>
                            <span className="font-medium">{formatPrice(ground.morningPrice)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Evening:</span>
                            <span className="font-medium">{formatPrice(ground.eveningPrice)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Bookings:</span>
                            <span className="font-medium">{ground._count.bookings}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/grounds/${ground.id}`)}
                            className="flex-1 btn-secondary text-sm flex items-center justify-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => router.push(`/admin/grounds/${ground.id}/edit`)}
                            className="flex-1 btn-outline text-sm flex items-center justify-center"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Bookings</h2>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                    <p className="text-gray-600">Bookings will appear here when customers book your grounds</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ground
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.customerName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {booking.customerPhone}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.ground.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div>{new Date(booking.date).toLocaleDateString('en-LK')}</div>
                                <div className="text-gray-500">
                                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatPrice(booking.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                booking.status === 'CANCELLED' || booking.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {booking.status === 'CANCELLED' || booking.status === 'cancelled' ? 'Cancelled' : 'Active'}
                              </span>
                            </td>
                          
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {booking.status === 'CANCELLED' || booking.status === 'cancelled' ? (
                                <span className="text-gray-400 text-sm">Cancelled</span>
                              ) : (
                                <button
                                  onClick={() => handleCancelBooking(booking)}
                                  className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                >
                                  <X className="h-4 w-4" />
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Booking</h3>
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                  setSelectedBooking(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedBooking && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Customer:</strong> {selectedBooking.customerName}</p>
                  <p><strong>Phone:</strong> {selectedBooking.customerPhone}</p>
                  <p><strong>Ground:</strong> {selectedBooking.ground.name}</p>
                  <p><strong>Date:</strong> {new Date(selectedBooking.date).toLocaleDateString('en-LK')}</p>
                  <p><strong>Time:</strong> {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}</p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Please provide a reason for cancelling this booking..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                  setSelectedBooking(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmCancelBooking}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
