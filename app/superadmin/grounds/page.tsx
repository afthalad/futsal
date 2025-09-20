'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Eye, MessageSquare } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatFirebaseDate } from '@/lib/utils'
import toast from 'react-hot-toast'

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
    name: string | null
    phone: string
  }
}

export default function SuperAdminGroundsPage() {
  const [grounds, setGrounds] = useState<Ground[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [selectedGround, setSelectedGround] = useState<Ground | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchGrounds()
  }, [])

  const fetchGrounds = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/grounds', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Fetched grounds:', data.grounds)
        setGrounds(data.grounds || [])
      } else {
        toast.error('Failed to fetch grounds')
      }
    } catch (error) {
      console.error('Error fetching grounds:', error)
      toast.error('Failed to fetch grounds')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (groundId: string) => {
    setProcessing(groundId)
    try {
      const token = localStorage.getItem('token')
      console.log('Approving ground:', groundId)
      const response = await fetch(`/api/admin/grounds/${groundId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'APPROVE' })
      })

      if (response.ok) {
        toast.success('Ground approved successfully')
        fetchGrounds()
      } else {
        const data = await response.json()
        console.error('Approval failed:', data)
        toast.error(data.error || 'Failed to approve ground')
      }
    } catch (error) {
      console.error('Error approving ground:', error)
      toast.error('Failed to approve ground')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async () => {
    if (!selectedGround || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setProcessing(selectedGround.id)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/grounds/${selectedGround.id}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'REJECT', 
          reason: rejectReason.trim() 
        })
      })

      if (response.ok) {
        toast.success('Ground rejected successfully')
        setShowRejectModal(false)
        setSelectedGround(null)
        setRejectReason('')
        fetchGrounds()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to reject ground')
      }
    } catch (error) {
      console.error('Error rejecting ground:', error)
      toast.error('Failed to reject ground')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (ground: Ground) => {
    const isResubmitted = ground.status === 'PENDING' && ground.rejectionReason && 
      ground.reviewedAt && ground.updatedAt && 
      new Date(ground.updatedAt.toDate ? ground.updatedAt.toDate() : ground.updatedAt) > new Date(ground.reviewedAt.toDate ? ground.reviewedAt.toDate() : ground.reviewedAt)
    
    switch (ground.status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            {isResubmitted ? 'Resubmitted' : 'Pending'}
          </Badge>
        )
      case 'APPROVED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'REJECTED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{ground.status}</Badge>
    }
  }

  const filteredGrounds = grounds.filter(ground => 
    filter === 'ALL' || ground.status === filter
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ground Review</h1>
          <p className="text-gray-600">Review and approve/reject ground submissions</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'PENDING', label: 'Pending', count: grounds.filter(g => g.status === 'PENDING').length },
              { key: 'APPROVED', label: 'Approved', count: grounds.filter(g => g.status === 'APPROVED').length },
              { key: 'REJECTED', label: 'Rejected', count: grounds.filter(g => g.status === 'REJECTED').length },
              { key: 'ALL', label: 'All', count: grounds.length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Debug Info</h3>
            <p className="text-xs text-blue-700">
              Total grounds: {grounds.length} | 
              Pending: {grounds.filter(g => g.status === 'PENDING').length} | 
              Approved: {grounds.filter(g => g.status === 'APPROVED').length} | 
              Rejected: {grounds.filter(g => g.status === 'REJECTED').length}
            </p>
          </div>
        )}

        {/* Grounds List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGrounds.map((ground) => (
            <Card key={ground.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                      {ground.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{ground.location}, {ground.city}</p>
                  </div>
                  {getStatusBadge(ground)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Owner Info */}
                <div className="text-sm">
                  <p className="text-gray-600">Owner: {ground.owner.name || ground.owner.phone}</p>
                  <p className="text-gray-600">Phone: {ground.phone}</p>
                  {ground.secondaryPhone && <p className="text-gray-600">Secondary Phone: {ground.secondaryPhone}</p>}
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-sm font-bold text-green-600">
                      {formatPrice(ground.morningPrice)}
                    </div>
                    <div className="text-xs text-gray-600">Morning</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-sm font-bold text-blue-600">
                      {formatPrice(ground.eveningPrice)}
                    </div>
                    <div className="text-xs text-gray-600">Evening</div>
                  </div>
                </div>

                {/* Amenities */}
                {ground.amenities.length > 0 && (
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {ground.amenities.slice(0, 3).map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {ground.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{ground.amenities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {ground.status === 'REJECTED' && ground.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{ground.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push(`/grounds/${ground.id}`)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  {ground.status === 'PENDING' && (
                    <>
                      <Button
                        onClick={() => handleApprove(ground.id)}
                        disabled={processing === ground.id}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedGround(ground)
                          setShowRejectModal(true)
                        }}
                        disabled={processing === ground.id}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>

                {/* Timestamps */}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  <p>Created: {formatFirebaseDate(ground.createdAt)}</p>
                  {ground.reviewedAt && (
                    <p>Reviewed: {formatFirebaseDate(ground.reviewedAt)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredGrounds.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {filter === 'PENDING' ? <Clock className="h-12 w-12 mx-auto" /> :
               filter === 'APPROVED' ? <CheckCircle className="h-12 w-12 mx-auto" /> :
               filter === 'REJECTED' ? <XCircle className="h-12 w-12 mx-auto" /> :
               <Eye className="h-12 w-12 mx-auto" />}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {filter.toLowerCase()} grounds
            </h3>
            <p className="text-gray-600">
              {filter === 'PENDING' ? 'No grounds are waiting for review' :
               filter === 'APPROVED' ? 'No grounds have been approved yet' :
               filter === 'REJECTED' ? 'No grounds have been rejected' :
               'No grounds found'}
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedGround && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Reject Ground
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Please provide a reason for rejecting "{selectedGround.name}":
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedGround(null)
                    setRejectReason('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing === selectedGround.id || !rejectReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {processing === selectedGround.id ? 'Rejecting...' : 'Reject Ground'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
