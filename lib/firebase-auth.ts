import { auth } from './firebase'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

// Firebase phone authentication functions
export const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; error?: string; confirmationResult?: ConfirmationResult }> => {
  try {
    // Check if we're in browser environment
    if (!isBrowser) {
      // console.log('🚫 Firebase phone auth not available on server side')
      return { 
        success: false, 
        error: 'Phone authentication is only available in browser environment' 
      }
    }

    // Format phone number for Firebase
    const formattedPhone = phoneNumber.startsWith('+94') ? phoneNumber : `+94${phoneNumber.replace(/^0/, '')}`
    
    // console.log('📱 Sending OTP via Firebase to:', formattedPhone)
    
    // Clean up any existing reCAPTCHA containers
    const existingContainer = document.getElementById('recaptcha-container')
    if (existingContainer) {
      existingContainer.remove()
    }
    
    // Create fresh reCAPTCHA container
    const recaptchaContainer = document.createElement('div')
    recaptchaContainer.id = 'recaptcha-container'
    recaptchaContainer.style.display = 'none'
    document.body.appendChild(recaptchaContainer)
    
    // Initialize reCAPTCHA verifier (invisible)
    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response: any) => {
        // console.log('reCAPTCHA solved')
      },
      'expired-callback': () => {
        // console.log('reCAPTCHA expired')
      }
    })
    
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)
      
      // console.log('✅ OTP sent successfully via Firebase')
      return { 
        success: true, 
        confirmationResult 
      }
    } catch (error: any) {
      // console.error('Firebase sendOTP error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to send OTP' 
      }
    } finally {
      // Clean up reCAPTCHA verifier and container
      try {
        recaptchaVerifier.clear()
      } catch (e) {
        // console.log('reCAPTCHA verifier already cleared')
      }
      
      // Remove the container after a short delay to ensure cleanup
      setTimeout(() => {
        const container = document.getElementById('recaptcha-container')
        if (container) {
          container.remove()
        }
      }, 1000)
    }
  } catch (error: any) {
    // console.error('Firebase sendOTP error:', error)
    return { success: false, error: error.message || 'Failed to send OTP' }
  }
}

export const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string): Promise<{ success: boolean; error?: string; idToken?: string }> => {
  try {
    // console.log('🔍 Verifying OTP with Firebase...')
    
    // Verify OTP with Firebase
    const result = await confirmationResult.confirm(otp)
    
    if (result.user) {
      // Get the ID token
      const idToken = await result.user.getIdToken()
      
      // console.log('✅ OTP verified successfully with Firebase')
      
      return { 
        success: true, 
        idToken 
      }
    } else {
      return { success: false, error: 'No user returned from verification' }
    }
  } catch (error: any) {
    // console.error('Firebase verification error:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to verify OTP' 
    }
  }
}

export const signOut = async () => {
  try {
    await auth.signOut()
    return { success: true }
  } catch (error: any) {
    // console.error('Sign out error:', error)
    return { success: false, error: error.message }
  }
}

export const getCurrentUser = () => {
  return auth.currentUser
}

export const onAuthStateChanged = (callback: (user: any) => void) => {
  return auth.onAuthStateChanged(callback)
}