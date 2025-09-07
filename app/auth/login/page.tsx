'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { verifyOTP } from '@/lib/firebase-auth'

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone')
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    name: ''
  })
  const [loading, setLoading] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // No reCAPTCHA initialization needed
  }, [])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number')
      return
    }

    // Validate Sri Lankan phone number
    const phoneRegex = /^(0|94)[0-9]{9}$/
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid Sri Lankan phone number')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('OTP sent to your phone number via SMS')
        setStep('otp')
      } else {
        toast.error(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      toast.error('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.otp.trim()) {
      toast.error('Please enter the OTP')
      return
    }

    setLoading(true)

    try {
      // Verify OTP with backend
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: formData.phone,
          otp: formData.otp,
          role: 'GROUND_OWNER'
        })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        toast.success('Login successful!')
        
        // Redirect based on user role
        if (data.user?.role === 'SUPER_ADMIN') {
          router.push('/admin/super')
        } else {
          router.push('/admin/dashboard')
        }
      } else {
        if (data.error === 'Name is required for new users' || data.error === 'Name is required for existing users without profile') {
          // Store a placeholder confirmation result for users who need to complete profile
          setConfirmationResult({ isNewUser: true })
          toast.success('OTP verified! Please complete your profile')
          setStep('name')
        } else {
          toast.error(data.error || 'Failed to verify OTP')
        }
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      toast.error('Failed to verify OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter your name')
      return
    }

    if (!confirmationResult) {
      toast.error('Please complete phone verification first')
      return
    }

    setLoading(true)

    try {
      // For new users, we don't need to re-verify with Firebase
      // Just send the name to complete registration
      if (confirmationResult.isNewUser) {
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: formData.phone,
            otp: formData.otp,
            name: formData.name,
            role: 'GROUND_OWNER'
          })
        })

        const data = await response.json()

        if (response.ok) {
          localStorage.setItem('token', data.token)
          toast.success('Registration successful!')
          
          // Redirect based on user role
          if (data.user?.role === 'SUPER_ADMIN') {
            router.push('/admin/super')
          } else {
            router.push('/admin/dashboard')
          }
        } else {
          toast.error(data.error || 'Failed to complete registration')
        }
      } else {
        // Re-verify OTP with Firebase for existing users
        const result = await verifyOTP(confirmationResult, formData.otp)
        
        if (result.success && result.idToken) {
          const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone: formData.phone,
              idToken: result.idToken,
              name: formData.name,
              role: 'GROUND_OWNER'
            })
          })

          const data = await response.json()

          if (response.ok) {
            localStorage.setItem('token', data.token)
            toast.success('Registration successful!')
            
            // Redirect based on user role
            if (data.user?.role === 'SUPER_ADMIN') {
              router.push('/admin/super')
            } else {
              router.push('/admin/dashboard')
            }
          } else {
            toast.error(data.error || 'Failed to complete registration')
          }
        } else {
          toast.error('Please verify your phone number again')
          setStep('otp')
        }
      }
    } catch (error) {
      console.error('Complete profile error:', error)
      toast.error('Failed to complete registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {step === 'phone' && 'Join as Ground Owner'}
            {step === 'otp' && 'Verify Phone Number'}
            {step === 'name' && 'Complete Profile'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'phone' && 'Enter your phone number to get started'}
            {step === 'otp' && 'Enter the verification code sent to your phone'}
            {step === 'name' && 'Please provide your name to complete registration'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={
            step === 'phone' ? handleSendOTP :
            step === 'otp' ? handleVerifyOTP :
            handleCompleteProfile
          }>
            {step === 'phone' && (
              <div>
                <label className="label">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  placeholder="Enter your phone number (e.g., 0771234567)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your Sri Lankan phone number (10 digits starting with 0)
                </p>
              </div>
            )}

            {step === 'otp' && (
              <div>
                <label className="label">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                  className="input-field text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 6-digit code sent to {formData.phone}
                </p>
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  Enter the 6-digit verification code sent to your phone
                </p>
              </div>
            )}

            {step === 'name' && (
              <div>
                <label className="label">
                  <User className="h-4 w-4 inline mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}

            <div>
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Processing...' : 
                  step === 'phone' ? 'Send OTP' :
                  step === 'otp' ? 'Verify OTP' :
                  'Complete Registration'
                }
              </button>
            </div>

            {step !== 'phone' && (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(step === 'otp' ? 'phone' : 'otp')}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  <ArrowLeft className="h-4 w-4 inline mr-1" />
                  Back
                </button>
                
                {step === 'otp' && (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="text-sm text-primary-600 hover:text-primary-500"
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            )}

            {/* reCAPTCHA disabled - using development mode */}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* reCAPTCHA container for Firebase phone authentication */}
      <div id="recaptcha-container"></div>
    </div>
  )
}
