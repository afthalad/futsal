'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, Phone, Mail } from 'lucide-react'
import Navbar from '@/components/Navbar'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  phone: string
  name?: string
  role: 'SUPER_ADMIN' | 'GROUND_OWNER' | 'USER'
  isActive: boolean
  createdAt: any
  updatedAt: any
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setFetching(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()

      if (response.ok) {
        setProfile(data.user)
        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || ''
        })
      } else {
        toast.error('Failed to fetch profile')
        router.push('/admin/dashboard')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to fetch profile')
      router.push('/admin/dashboard')
    } finally {
      setFetching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setFieldErrors({})
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    // Basic phone validation
    const phoneRegex = /^[0-9+\-\s()]+$/
    if (!phoneRegex.test(formData.phone)) {
      setFieldErrors({ phone: 'Please enter a valid phone number' })
      toast.error('Please enter a valid phone number')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Profile updated successfully!')
        setProfile(data.user)
        setFieldErrors({})
      } else {
        const errorMessage = data.error || 'Failed to update profile'
        
        // Check if it's a specific field error
        if (errorMessage.includes('phone number')) {
          setFieldErrors({ phone: errorMessage })
        } else if (errorMessage.includes('name')) {
          setFieldErrors({ name: errorMessage })
        }
        
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            <p className="text-sm text-gray-600 mt-1">Update your personal details</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                  required
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your phone number"
                  required
                />
                {fieldErrors.phone ? (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    This is your primary contact number for the platform
                  </p>
                )}
              </div>

              {/* Account Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium capitalize">{profile?.role?.toLowerCase().replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Status:</span>
                    <span className={`font-medium ${profile?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {profile?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-medium">
                      {profile?.createdAt ? new Date(profile.createdAt.toDate ? profile.createdAt.toDate() : profile.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Security Notice</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Your phone number is used for authentication and important notifications. Make sure it's current and accessible.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
