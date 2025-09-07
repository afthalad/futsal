import { supabase } from './supabase'

// Supabase phone authentication functions
export const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Format phone number for Supabase (Sri Lankan format)
    const formattedPhone = phoneNumber.startsWith('+94') ? phoneNumber : `+94${phoneNumber.replace(/^0/, '')}`
    
    console.log('📱 Sending OTP via Supabase to:', formattedPhone)
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        channel: 'sms'
      }
    })
    
    if (error) {
      console.error('Supabase OTP error:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ OTP sent successfully via Supabase')
    return { success: true }
  } catch (error: any) {
    console.error('Supabase sendOTP error:', error)
    return { success: false, error: error.message || 'Failed to send OTP' }
  }
}

export const verifyOTP = async (phone: string, otp: string): Promise<{ success: boolean; error?: string; session?: any }> => {
  try {
    // Format phone number
    const formattedPhone = phone.startsWith('+94') ? phone : `+94${phone.replace(/^0/, '')}`
    
    console.log('🔍 Verifying OTP with Supabase...')
    console.log(`📞 Phone: ${formattedPhone}`)
    console.log(`🔢 OTP: ${otp}`)
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms'
    })
    
    if (error) {
      console.error('Supabase verification error:', error)
      return { success: false, error: error.message }
    }
    
    if (data.session) {
      console.log('✅ OTP verified successfully with Supabase')
      return { success: true, session: data.session }
    } else {
      return { success: false, error: 'No session created' }
    }
  } catch (error: any) {
    console.error('Supabase verification error:', error)
    return { success: false, error: error.message || 'Failed to verify OTP' }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error: any) {
    console.error('Sign out error:', error)
    return { success: false, error: error.message }
  }
}

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Get current user error:', error)
      return null
    }
    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Get current session error:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('Get current session error:', error)
    return null
  }
}
