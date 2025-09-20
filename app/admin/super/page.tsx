'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Users, MapPin, ToggleLeft, ToggleRight, Eye, Trash2, Edit, Plus, Calendar, Phone, Clock, DollarSign, X, User, CheckCircle, RotateCcw } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { formatTime, formatFirebaseDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import SuperAdminTopUpSystem from '@/components/SuperAdminTopUpSystem'
import DisableReasonModal from '@/components/DisableReasonModal'
import CancellationReasonModal from '@/components/CancellationReasonModal'
import GroundReviewModal from '@/components/GroundReviewModal'
import GroundViewModal from '@/components/GroundViewModal'
import Tooltip from '@/components/Tooltip'

interface User {
  id: string
  phone: string
  name?: string
  role: 'SUPER_ADMIN' | 'GROUND_OWNER' | 'USER'
  isActive: boolean
  createdAt: any
  updatedAt: any
  disableReason?: string
  disabledAt?: any

}

interface Ground {
  id: string
  name: string
  description?: string
  location: string
  city: string
  phone: string
  secondaryPhone?: string
  images: string[]
  amenities: string[]
  morningPrice: number
  eveningPrice: number
  isActive: boolean
  ownerId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  reviewedBy?: string
  reviewedAt?: any
  createdAt: any
  updatedAt: any
  owner: {
    name?: string
    phone: string
  }
}

interface Booking {
  id: string
  groundId: string
  customerName: string
  customerPhone: string
  cancellationReason: string
  date: string
  startTime: string
  endTime: string
  price: number
  reason?: string
  status?: string
  ground: {
    name: string
    location: string
    city: string
  }
  createdAt: any
  updatedAt: any
}

export default function SuperAdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [grounds, setGrounds] = useState<Ground[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'grounds' | 'bookings' | 'commission'>('bookings')
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [disableItem, setDisableItem] = useState<{type: 'user' | 'ground', id: string, name: string, currentStatus: boolean} | null>(null)
  const [disabling, setDisabling] = useState(false)
  const [showCancelBookingModal, setShowCancelBookingModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [showGroundReviewModal, setShowGroundReviewModal] = useState(false)
  const [selectedGround, setSelectedGround] = useState<Ground | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [showGroundViewModal, setShowGroundViewModal] = useState(false)
  const [selectedGroundForView, setSelectedGroundForView] = useState<Ground | null>(null)
  const [commissionStats, setCommissionStats] = useState({
    totalCommissionDue: 0,
    totalGroundOwners: 0,
    groundOwnersWithDues: 0,
    pendingCommissions: 0
  })
  const router = useRouter()

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'grounds') {
      fetchGrounds()
    } else if (activeTab === 'bookings') {
      fetchBookings()
    }
    // Commission tab doesn't need to fetch data on tab change as it handles its own data fetching
  }, [activeTab])

  // Load initial data for stats cards
  useEffect(() => {
    fetchUsers()
    fetchGrounds()
    fetchBookings()
    fetchCommissionStats()
  }, [])


  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        return
      }
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchGrounds = async () => {
    try {
      setLoading(true)
      
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        return
      }
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/grounds', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGrounds(data.grounds)
      } else {
        toast.error('Failed to load grounds')
      }
    } catch (error) {
      console.error('Error fetching grounds:', error)
      toast.error('Failed to load grounds')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        return
      }
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        setBookings(data.bookings)
      } else {
        toast.error('Failed to load bookings')
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const fetchCommissionStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/commission', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCommissionStats({
          totalCommissionDue: data.totalAmount || 0,
          totalGroundOwners: data.commissions?.length || 0,
          groundOwnersWithDues: data.commissions?.filter((c: any) => c.amount > 0).length || 0,
          pendingCommissions: data.pendingCount || 0
        })
      } else {
        console.error('Failed to fetch commission stats')
      }
    } catch (error) {
      console.error('Error fetching commission stats:', error)
    }
  }

  const handleToggleUser = (userId: string, userName: string, currentStatus: boolean) => {
    if (currentStatus) {
      // Only show reason modal when disabling
      setDisableItem({
        type: 'user',
        id: userId,
        name: userName,
        currentStatus
      })
      setShowDisableModal(true)
    } else {
      // Enable directly without reason
      toggleUserStatus(userId, currentStatus, '')
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean, reason: string = '') => {
    try {
      setDisabling(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        toast.success(`User ${currentStatus ? 'disabled' : 'enabled'} successfully`)
        fetchUsers()
        if (currentStatus) {
          // Send SMS notification for disable action
          try {
            await fetch('/api/sms/send-notification', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                phone: users.find(u => u.id === userId)?.phone,
                message: `Your account has been disabled. Reason: ${reason}. Contact support for assistance.`
              })
            })
          } catch (smsError) {
            console.error('SMS notification failed:', smsError)
          }
        }
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update user status')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Failed to update user status')
    } finally {
      setDisabling(false)
    }
  }

  const handleToggleGround = (groundId: string, groundName: string, currentStatus: boolean) => {
    if (currentStatus) {
      // Only show reason modal when disabling
      setDisableItem({
        type: 'ground',
        id: groundId,
        name: groundName,
        currentStatus
      })
      setShowDisableModal(true)
    } else {
      // Enable directly without reason
      toggleGroundStatus(groundId, currentStatus, '')
    }
  }

  const toggleGroundStatus = async (groundId: string, currentStatus: boolean, reason: string = '') => {
    try {
      setDisabling(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/grounds/${groundId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        toast.success(`Ground ${currentStatus ? 'disabled' : 'enabled'} successfully`)
        fetchGrounds()
        if (currentStatus) {
          // Send SMS notification to ground owner
          try {
            const ground = grounds.find(g => g.id === groundId)
            if (ground) {
              await fetch('/api/sms/send-notification', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  phone: ground.owner.phone,
                  message: `Your ground "${ground.name}" has been disabled. Reason: ${reason}. Contact support for assistance.`
                })
              })
            }
          } catch (smsError) {
            console.error('SMS notification failed:', smsError)
          }
        }
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update ground status')
      }
    } catch (error) {
      console.error('Error updating ground status:', error)
      toast.error('Failed to update ground status')
    } finally {
      setDisabling(false)
    }
  }

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        fetchUsers()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const deleteGround = async (groundId: string, groundName: string) => {
    if (!confirm(`Are you sure you want to delete ground "${groundName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/grounds/${groundId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Ground deleted successfully')
        fetchGrounds()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete ground')
      }
    } catch (error) {
      console.error('Error deleting ground:', error)
      toast.error('Failed to delete ground')
    }
  }

  const handleDisableConfirm = async (reason: string) => {
    if (!disableItem) return

    if (disableItem.type === 'user') {
      await toggleUserStatus(disableItem.id, disableItem.currentStatus, reason)
    } else {
      await toggleGroundStatus(disableItem.id, disableItem.currentStatus, reason)
    }

    setShowDisableModal(false)
    setDisableItem(null)
  }

  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowCancelBookingModal(true)
  }

  const confirmCancelBooking = async (reason: string) => {
    if (!selectedBooking) {
      toast.error('No booking selected for cancellation')
      return
    }

    try {
      setCancelling(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/bookings/${selectedBooking.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason })
      })

      if (response.ok) {
        toast.success('Booking cancelled successfully. SMS notifications sent to customer and ground owner.')
        setShowCancelBookingModal(false)
        setSelectedBooking(null)
        fetchBookings() // Refresh bookings
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to cancel booking')
      }
    } catch (error) {
      console.error('Cancel booking error:', error)
      toast.error('Failed to cancel booking. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const handleReviewGround = (ground: Ground) => {
    setSelectedGround(ground)
    setShowGroundReviewModal(true)
  }

  const handleApproveGround = async (groundId: string) => {
    setReviewing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/grounds/${groundId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'APPROVE' })
      })

      if (response.ok) {
        toast.success('Ground approved successfully!')
        setShowGroundReviewModal(false)
        setSelectedGround(null)
        fetchGrounds() // Refresh grounds
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to approve ground')
      }
    } catch (error) {
      console.error('Approve ground error:', error)
      toast.error('Failed to approve ground. Please try again.')
    } finally {
      setReviewing(false)
    }
  }

  const handleRejectGround = async (groundId: string, reason: string) => {
    setReviewing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/grounds/${groundId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'REJECT', reason })
      })

      if (response.ok) {
        toast.success('Ground rejected successfully!')
        setShowGroundReviewModal(false)
        setSelectedGround(null)
        fetchGrounds() // Refresh grounds
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to reject ground')
      }
    } catch (error) {
      console.error('Reject ground error:', error)
      toast.error('Failed to reject ground. Please try again.')
    } finally {
      setReviewing(false)
    }
  }

  const handleViewGround = (ground: Ground) => {
    if (ground.status === 'PENDING') {
      // Show modal for under review grounds
      setSelectedGroundForView(ground)
      setShowGroundViewModal(true)
    } else if (ground.status === 'APPROVED') {
      // Redirect to public ground details page for approved grounds
      router.push(`/grounds/${ground.id}`)
    } else {
      // For rejected grounds, show modal
      setSelectedGroundForView(ground)
      setShowGroundViewModal(true)
    }
  }

  const handleSendToReview = async (groundId: string, groundName: string) => {
    if (!confirm(`Are you sure you want to send "${groundName}" back to review? This will change its status from approved to pending.`)) {
      return
    }

    setReviewing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/grounds/${groundId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'SEND_TO_REVIEW' })
      })

      if (response.ok) {
        toast.success('Ground sent back to review successfully!')
        fetchGrounds() // Refresh grounds
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to send ground to review')
      }
    } catch (error) {
      console.error('Send to review error:', error)
      toast.error('Failed to send ground to review. Please try again.')
    } finally {
      setReviewing(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800'
      case 'GROUND_OWNER': return 'bg-blue-100 text-blue-800'
      case 'USER': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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

  // console.log('SuperAdminPage rendering, loading:', loading, 'users:', users.length, 'grounds:', grounds.length)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
                <p className="text-gray-600">Manage users and grounds across the platform</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/profile')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <User className="h-4 w-4 mr-2" />
              Profile Settings
            </button>
          </div>
        </div> */}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Grounds</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{grounds.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Today's Bookings</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {bookings.filter(booking => {
                    const today = new Date().toDateString()
                    const bookingDate = new Date(booking.date).toDateString()
                    return today === bookingDate
                  }).length}
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
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Commission Due</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  Rs. {commissionStats.totalCommissionDue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Owners</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{commissionStats.totalGroundOwners}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 rounded-lg">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">With Dues</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{commissionStats.groundOwnersWithDues}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Ground Owners
              </button>
              <button
                onClick={() => setActiveTab('grounds')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'grounds'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Grounds
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bookings
              </button>
              <button
                onClick={() => setActiveTab('commission')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'commission'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Commission
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Users</h2>
                  <button
                    onClick={() => router.push('/admin/users/new')}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add New User
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-600">Users will appear here when they register</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.sort((a, b) => b.createdAt._seconds - a.createdAt._seconds).map((user) => (
                          <tr key={user.id}>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name || 'No name'}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500">
                                  {user.phone}
                                </div>
                                <div className="sm:hidden mt-1">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                                    {user.role}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <Tooltip content={user.disableReason ? `Disabled reason: ${user.disableReason}` : ''}>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.isActive ? 'Active' : 'Disabled'}
                                </span>
                              </Tooltip>
                            </td>
                            <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatFirebaseDate(user.updatedAt || user.createdAt)}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleToggleUser(user.id, user.name || user.phone, user.isActive)}
                                  className={`flex items-center space-x-1 ${
                                    user.isActive 
                                      ? 'text-red-600 hover:text-red-900' 
                                      : 'text-green-600 hover:text-green-900'
                                  }`}
                                >
                                  {user.isActive ? (
                                    <>
                                      <ToggleLeft className="h-4 w-4" />
                                      <span>Disable</span>
                                    </>
                                  ) : (
                                    <>
                                      <ToggleRight className="h-4 w-4" />
                                      <span>Enable</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                  title="Edit User"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span>Edit</span>
                                </button>
                                {user.role !== 'SUPER_ADMIN' && (
                                  <button
                                    onClick={() => deleteUser(user.id, user.name || user.phone)}
                                    className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : activeTab === 'grounds' ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Grounds Management</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push('/superadmin/grounds')}
                      className="btn-outline flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Review Grounds
                    </button>
                    <button
                      onClick={() => router.push('/admin/grounds/new')}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add New Ground
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : grounds.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No grounds found</h3>
                    <p className="text-gray-600">Grounds will appear here when ground owners add them</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ground
                          </th>
                          <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Owner
                          </th>
                          <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {grounds.sort((a, b) => b.createdAt._seconds - a.createdAt._seconds).map((ground) => (
                          <tr key={ground.id}>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {ground.name}
                              </div>
                              <div className="sm:hidden mt-1">
                                <div className="text-xs text-gray-500">
                                  {ground.owner.name || 'No name'} - {ground.owner.phone}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {ground.location}, {ground.city}
                                </div>
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {ground.owner.name || 'No name'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {ground.owner.phone}
                                </div>
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ground.location}, {ground.city}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  ground.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  ground.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {ground.status === 'PENDING' ? 'Under Review' :
                                   ground.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  ground.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {ground.isActive ? 'Active' : 'Disabled'}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {ground.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleReviewGround(ground)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Review Ground"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                                {ground.status === 'APPROVED' && (
                                  <button
                                    onClick={() => handleSendToReview(ground.id, ground.name)}
                                    className="text-orange-600 hover:text-orange-900"
                                    title="Send to Review"
                                    disabled={reviewing}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleViewGround(ground)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="View Ground"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleGround(ground.id, ground.name, ground.isActive)}
                                  className={`${
                                    ground.isActive 
                                      ? 'text-red-600 hover:text-red-900' 
                                      : 'text-green-600 hover:text-green-900'
                                  }`}
                                  title={ground.isActive ? 'Disable Ground' : 'Enable Ground'}
                                >
                                  {ground.isActive ? (
                                    <ToggleLeft className="h-4 w-4" />
                                  ) : (
                                    <ToggleRight className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => router.push(`/admin/grounds/${ground.id}/edit`)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit Ground"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteGround(ground.id, ground.name)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete Ground"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : activeTab === 'bookings' ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Bookings Management</h2>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                    <p className="text-gray-600">Bookings will appear here when customers make reservations</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ground
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reason
                          </th>
                          <th className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.sort((a, b) => b.createdAt._seconds - a.createdAt._seconds).map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-normal text-gray-900">
                                  {booking.customerName}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {booking.customerPhone}
                                </div>
                                <div className="sm:hidden mt-1">
                                  <div className="text-xs text-gray-500">
                                    {booking.ground?.name || 'Ground not found'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Rs. {booking.price.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-normal text-gray-900">
                                  {booking.ground?.name || 'Ground not found'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {booking.ground ? `${booking.ground.location}, ${booking.ground.city}` : 'Location not available'}
                                </div>
                              </div>
                            </td>
                             <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                               <div>
                                 {new Date(booking.date).toLocaleDateString('en-LK')}
                               </div>
                               <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                                 <Clock className="h-3 w-3 mr-1" />
                                 {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                               </div>
                             </td>

                            <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              Rs. {booking.price.toLocaleString()}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                booking.status === 'CANCELLED' || booking.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {booking.status === 'CANCELLED' || booking.status === 'cancelled' ? 'Cancelled' : 'Active'}
                              </span>
                            </td>
                            <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Tooltip content={booking.cancellationReason || 'No reason provided'}>
                                <div className="truncate max-w-xs cursor-help">
                                  {booking.cancellationReason ? (booking.cancellationReason.length > 10 ? booking.cancellationReason.substring(0, 10) + '...' : booking.cancellationReason) : '-'}
                                </div>
                              </Tooltip>
                            </td>
                      

                              <td className="hidden xl:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatFirebaseDate(booking.updatedAt || booking.createdAt)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                                  <button
                                    onClick={() => router.push(`/admin/bookings/${booking.id}/edit`)}
                                    className="text-blue-600 hover:text-blue-900 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs bg-blue-50 hover:bg-blue-100"
                                    title="Edit Booking"
                                  >
                                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Edit</span>
                                  </button>
                                  {booking.status !== 'CANCELLED' && booking.status !== 'cancelled' && (
                                    <button
                                      onClick={() => handleCancelBooking(booking)}
                                      className="text-red-600 hover:text-red-900 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs bg-red-50 hover:bg-red-100"
                                      title="Cancel Booking"
                                    >
                                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span className="hidden sm:inline">Cancel</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : activeTab === 'commission' ? (
              <div>
                <SuperAdminTopUpSystem />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Disable Reason Modal */}
      <DisableReasonModal
        isOpen={showDisableModal}
        onClose={() => {
          setShowDisableModal(false)
          setDisableItem(null)
        }}
        onConfirm={handleDisableConfirm}
        title={disableItem?.type === 'user' ? 'Disable Ground Owner' : 'Disable Ground'}
        itemName={disableItem?.name || ''}
        itemType={disableItem?.type === 'user' ? 'ground owner' : 'ground'}
        loading={disabling}
      />

      {/* Booking Cancellation Modal */}
      <CancellationReasonModal
        isOpen={showCancelBookingModal}
        onClose={() => {
          setShowCancelBookingModal(false);
          setSelectedBooking(null);
        }}
        onConfirm={confirmCancelBooking}
        title="Cancel Booking"
        bookingDetails={selectedBooking ? {
          customerName: selectedBooking.customerName,
          customerPhone: selectedBooking.customerPhone,
          groundName: selectedBooking.ground?.name || 'Ground not found',
          date: new Date(selectedBooking.date).toLocaleDateString('en-LK'),
          time: `${formatTime(selectedBooking.startTime)} - ${formatTime(selectedBooking.endTime)}`
        } : undefined}
        loading={cancelling}
      />

      {/* Ground Review Modal */}
      <GroundReviewModal
        isOpen={showGroundReviewModal}
        onClose={() => {
          setShowGroundReviewModal(false)
          setSelectedGround(null)
        }}
        ground={selectedGround}
        onApprove={handleApproveGround}
        onReject={handleRejectGround}
        isProcessing={reviewing}
      />

      {/* Ground View Modal */}
      <GroundViewModal
        isOpen={showGroundViewModal}
        onClose={() => {
          setShowGroundViewModal(false)
          setSelectedGroundForView(null)
        }}
        ground={selectedGroundForView}
        userRole="SUPER_ADMIN"
      />
    </div>
  )
}