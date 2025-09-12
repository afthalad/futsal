// Free SMS Service for Sri Lanka
// Supports multiple providers for redundancy

// Import formatTime function for 12-hour time formatting
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

interface SMSProvider {
  name: string
  sendSMS: (phone: string, message: string) => Promise<{ success: boolean; error?: string }>
}


// Text.lk - Sri Lankan SMS service
class TextLKProvider implements SMSProvider {
  name = 'Text.lk'
  
  async sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Format phone number for Text.lk (remove + and use 94 prefix)
      const formattedPhone = phone.startsWith('+94') ? phone.substring(1) : 
                            phone.startsWith('94') ? phone : 
                            `94${phone.replace(/^0/, '')}`
      
      const response = await fetch('https://app.text.lk/api/v3/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.TEXT_LK_API_KEY}`,
        },
        body: JSON.stringify({
          recipient: formattedPhone,
          sender_id: process.env.TEXT_LK_SENDER_ID || 'TextLKDemo',
          type: 'plain',
          message: message,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        console.log('✅ SMS sent via Text.lk')
        return { success: true }
      } else {
        console.error('❌ Text.lk error:', data)
        return { success: false, error: data.message || 'Text.lk API error' }
      }
    } catch (error: any) {
      console.error('Text.lk SMS error:', error)
      return { success: false, error: error.message }
    }
  }
}

// Mock SMS Provider for development/testing
class MockSMSProvider implements SMSProvider {
  name = 'Mock SMS'
  
  async sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('='.repeat(60))
      console.log('📱 MOCK SMS SENT')
      console.log('='.repeat(60))
      console.log(`📞 To: ${phone}`)
      console.log(`📝 Message: ${message}`)
      console.log('='.repeat(60))
      console.log('ℹ️  This is a mock SMS for development')
      console.log('ℹ️  In production, this would be sent as a real SMS')
      console.log('='.repeat(60))
      
      return { success: true }
    } catch (error: any) {
      console.error('Mock SMS error:', error)
      return { success: false, error: error.message }
    }
  }
}

// SMS Service Manager
class SMSService {
  private providers: SMSProvider[] = []
  
  constructor() {
    // Add providers in order of preference
    this.providers.push(new TextLKProvider()) // Primary - Sri Lankan service
    this.providers.push(new MockSMSProvider()) // Fallback for development
  }
  
  async sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string; provider?: string }> {
    console.log(`📱 Attempting to send SMS to ${phone}`)
    
    // Try each provider until one succeeds
    for (const provider of this.providers) {
      try {
        console.log(`🔄 Trying ${provider.name}...`)
        const result = await provider.sendSMS(phone, message)
        
        if (result.success) {
          console.log(`✅ SMS sent successfully via ${provider.name}`)
          return { 
            success: true, 
            provider: provider.name 
          }
        } else {
          console.log(`❌ ${provider.name} failed: ${result.error}`)
        }
      } catch (error: any) {
        console.error(`❌ ${provider.name} error:`, error.message)
      }
    }
    
    // All providers failed
    return { 
      success: false, 
      error: 'All SMS providers failed. Please try again later.' 
    }
  }
  
  // Add a new provider
  addProvider(provider: SMSProvider) {
    this.providers.unshift(provider) // Add to beginning for higher priority
  }
}

// Export singleton instance
export const smsService = new SMSService()

// Export individual functions for easy use
export const sendSMS = (phone: string, message: string) => smsService.sendSMS(phone, message)

// Specific functions for different types of messages
export const sendBookingNotification = async (phone: string, groundName: string, date: string, time: string) => {
  const message = `🎉 New booking request for ${groundName} on ${date} at ${formatTime(time)}. Please check your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings`
  return await sendSMS(phone, message)
}

export const sendBookingConfirmation = async (phone: string, groundName: string, date: string, time: string) => {
  const message = `✅ Booking confirmed! ${groundName} on ${date} at ${formatTime(time)}. Thank you for choosing our futsal ground.`
  return await sendSMS(phone, message)
}

export const sendBookingConfirmationToCustomer = async (phone: string, groundName: string, date: string, time: string, price: number) => {
  const message = `✅ Booking confirmed! ${groundName} on ${date} at ${formatTime(time)}. Price: Rs.${price}. Thank you for choosing our futsal ground.`
  return await sendSMS(phone, message)
}

export const sendBookingConfirmationToOwner = async (phone: string, groundName: string, date: string, time: string, customerName: string, customerPhone: string, price: number) => {
  const message = `🎉 New booking! ${groundName} on ${date} at ${formatTime(time)}. Customer: ${customerName} (${customerPhone}). Price: Rs.${price}. Check dashboard for details.`
  return await sendSMS(phone, message)
}

export const sendBookingRejection = async (phone: string, groundName: string, date: string, time: string) => {
  const message = `❌ Sorry, your booking for ${groundName} on ${date} at ${formatTime(time)} was not available. Please try another time slot.`
  return await sendSMS(phone, message)
}

export const sendOTP = async (phone: string, otp: string) => {
  const message = `🔐 Your OTP code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`
  return await sendSMS(phone, message)
}

export const sendBookingCancellationToCustomer = async (phone: string, customerName: string, groundName: string, date: string, startTime: string, endTime: string, reason: string) => {
  const message = `Dear ${customerName},\n\nYour booking at ${groundName} has been cancelled by Puttalam Grounds.\n\nBooking Details:\nDate: ${new Date(date).toLocaleDateString('en-LK')}\nTime: ${formatTime(startTime)} - ${formatTime(endTime)}\n\nReason: ${reason}\n\nFor assistance, contact us at 0773078103.\n\n- Puttalam Grounds Team`
  return await sendSMS(phone, message)
}

export const sendBookingCancellationToOwner = async (phone: string, groundName: string, customerName: string, customerPhone: string, date: string, startTime: string, endTime: string, reason: string) => {
  const message = `Dear Ground Owner,\n\nA booking at your ground "${groundName}" has been cancelled by Puttalam Grounds.\n\nBooking Details:\nCustomer: ${customerName}\nPhone: ${customerPhone}\nDate: ${new Date(date).toLocaleDateString('en-LK')}\nTime: ${formatTime(startTime)} - ${formatTime(endTime)}\n\nReason: ${reason}\n\n- Puttalam Grounds Team`
  return await sendSMS(phone, message)
}