'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, Download } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

interface MonthlyPayment {
  id: string
  ownerId: string
  month: string
  year: number
  monthNumber: number
  totalBookings: number
  totalRevenue: number
  commissionAmount: number
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'VERIFIED'
  paymentSlipUrl?: string
  paymentSlipUploadedAt?: string
  verifiedAt?: string
  verifiedBy?: string
  createdAt: string
  updatedAt: string
}

interface Owner {
  id: string
  name?: string
  phone: string
}

export default function SuperAdminPaymentsPage() {
  const [payments, setPayments] = useState<MonthlyPayment[]>([])
  const [owners, setOwners] = useState<Map<string, Owner>>(new Map())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue' | 'verified'>('all')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments)
        setOwners(new Map(data.owners.map((owner: Owner) => [owner.id, owner])))
      } else {
        toast.error('Failed to fetch payments')
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (paymentId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('Payment verified successfully')
        fetchPayments()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to verify payment')
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      toast.error('Failed to verify payment')
    }
  }

  const rejectPayment = async (paymentId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('Payment rejected')
        fetchPayments()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reject payment')
      }
    } catch (error) {
      console.error('Error rejecting payment:', error)
      toast.error('Failed to reject payment')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'PAID':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'VERIFIED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'OVERDUE':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PAID':
        return 'bg-blue-100 text-blue-800'
      case 'VERIFIED':
        return 'bg-green-100 text-green-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true
    return payment.status === filter.toUpperCase()
  })

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Management</h2>
          <p className="text-gray-600">Review and verify ground owner commission payments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'paid', 'overdue', 'verified'] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === filterType
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Slip
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => {
                const owner = owners.get(payment.ownerId)
                return (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {owner?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {owner?.phone || payment.ownerId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatMonth(payment.month)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{formatPrice(payment.totalRevenue)}</div>
                        <div className="text-gray-500">{payment.totalBookings} bookings</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(payment.commissionAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentSlipUrl ? (
                        <a
                          href={payment.paymentSlipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">No slip</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {payment.status === 'PAID' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => verifyPayment(payment.id)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Verify
                          </button>
                          <button
                            onClick={() => rejectPayment(payment.id)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      )}
                      {payment.status === 'VERIFIED' && (
                        <span className="text-green-600 text-sm">Verified</span>
                      )}
                      {payment.status === 'PENDING' && (
                        <span className="text-yellow-600 text-sm">Waiting for payment</span>
                      )}
                      {payment.status === 'OVERDUE' && (
                        <span className="text-red-600 text-sm">Overdue</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
          <p className="text-gray-600">No payments match the current filter</p>
        </div>
      )}
    </div>
  )
}
