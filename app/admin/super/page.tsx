'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Users, MapPin, ToggleLeft, ToggleRight, Eye, Trash2, Edit, Plus, Calendar, Phone, Clock, DollarSign, X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { formatTime, formatFirebaseDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import SuperAdminTopUpSystem from '@/components/SuperAdminTopUpSystem'
import DisableReasonModal from '@/components/DisableReasonModal'
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
  location: string
  city: string
  isActive: boolean
  ownerId: string
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
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

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

  // Load initial data
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    }
  }, [])

  const checkAuth = async () => {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        return
      }
      
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

  const confirmCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation')
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
        body: JSON.stringify({ reason: cancelReason })
      })

      if (response.ok) {
        toast.success('Booking cancelled successfully. SMS notifications sent to customer and ground owner.')
        setShowCancelBookingModal(false)
        setCancelReason('')
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

  console.log('SuperAdminPage rendering, loading:', loading, 'users:', users.length, 'grounds:', grounds.length)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
              <p className="text-gray-600">Manage users and grounds across the platform</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ground Owners</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'GROUND_OWNER').length}
                </p>
              </div>
            </div>
          </div>

          

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Grounds</p>
                <p className="text-2xl font-bold text-gray-900">{grounds.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>
        </div> */}

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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.sort((a, b) => b.createdAt._seconds - a.createdAt._seconds).map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name || 'No name'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.phone}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Tooltip content={user.disableReason ? `Disabled reason: ${user.disableReason}` : ''}>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.isActive ? 'Active' : 'Disabled'}
                                </span>
                              </Tooltip>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatFirebaseDate(user.updatedAt || user.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                  <button
                    onClick={() => router.push('/admin/grounds/new')}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No grounds found</h3>
                    <p className="text-gray-600">Grounds will appear here when ground owners add them</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ground
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Owner
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
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
                        {grounds.sort((a, b) => b.createdAt._seconds - a.createdAt._seconds).map((ground) => (
                          <tr key={ground.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {ground.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {ground.owner.name || 'No name'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {ground.owner.phone}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ground.location}, {ground.city}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                ground.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {ground.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => router.push(`/grounds/${ground.id}`)}
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
                            Reason
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.sort((a, b) => b.createdAt._seconds - a.createdAt._seconds).map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-normal text-gray-900">
                                  {booking.customerName}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {booking.customerPhone}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-normal text-gray-900">
                                  {booking.ground?.name || 'Ground not found'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {booking.ground ? `${booking.ground.location}, ${booking.ground.city}` : 'Location not available'}
                                </div>
                              </div>
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                               <div>
                                 {new Date(booking.date).toLocaleDateString('en-LK')}
                               </div>
                               <div className="text-sm text-gray-500 flex items-center">
                                 <Clock className="h-3 w-3 mr-1" />
                                 {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                               </div>
                             </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              Rs. {booking.price.toLocaleString()}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Tooltip content={booking.cancellationReason || 'No reason provided'}>
                                <div className="truncate max-w-xs cursor-help">
                                  {booking.cancellationReason ? (booking.cancellationReason.length > 10 ? booking.cancellationReason.substring(0, 10) + '...' : booking.cancellationReason) : '-'}
                                </div>
                              </Tooltip>
                            </td>
                      

                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatFirebaseDate(booking.updatedAt || booking.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => router.push(`/admin/bookings/${booking.id}/edit`)}
                                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                    title="Edit Booking"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </button>
                                  {booking.status !== 'CANCELLED' && booking.status !== 'cancelled' && (
                                    <button
                                      onClick={() => handleCancelBooking(booking)}
                                      className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                      title="Cancel Booking"
                                    >
                                      <X className="h-4 w-4" />
                                      Cancel
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
      {showCancelBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Booking</h3>
              <button
                onClick={() => {
                  setShowCancelBookingModal(false)
                  setCancelReason('')
                  setSelectedBooking(null)
                }}
                disabled={cancelling}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Customer:</strong> {selectedBooking.customerName}</p>
                <p><strong>Phone:</strong> {selectedBooking.customerPhone}</p>
                <p><strong>Ground:</strong> {selectedBooking.ground?.name || 'Ground not found'}</p>
                <p><strong>Date:</strong> {new Date(selectedBooking.date).toLocaleDateString('en-LK')}</p>
                <p><strong>Time:</strong> {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}</p>
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
                onClick={() => {
                  setShowCancelBookingModal(false)
                  setCancelReason('')
                  setSelectedBooking(null)
                }}
                disabled={cancelling}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmCancelBooking}
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