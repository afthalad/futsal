// Free SMS Service for Sri Lanka
// Supports multiple providers for redundancy

// Import formatTime function for 12-hour time formatting
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes}${ampm}`
}

// Format time range for better display
function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`
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
          'Authorization': `Bearer ${process.env.SMS_API_KEY}`,
        },
        body: JSON.stringify({
          recipient: formattedPhone,
          sender_id: process.env.SMS_SENDER_ID || 'TextLKDemo',
          type: 'plain',
          message: message,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // console.log('✅ SMS sent via Text.lk')
        return { success: true }
      } else {
        // console.error('❌ Text.lk error:', data)
        return { success: false, error: data.message || 'Text.lk API error' }
      }
    } catch (error: any) {
      // console.error('Text.lk SMS error:', error)
      return { success: false, error: error.message }
    }
  }
}

// Mock SMS Provider for development/testing
class MockSMSProvider implements SMSProvider {
  name = 'Mock SMS'
  
  async sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      // console.log('='.repeat(60))
      // console.log('📱 MOCK SMS SENT')
      // console.log('='.repeat(60))
      // console.log(`📞 To: ${phone}`)
      // console.log(`📝 Message: ${message}`)
      // console.log('='.repeat(60))
      // console.log('ℹ️  This is a mock SMS for development')
      // console.log('ℹ️  In production, this would be sent as a real SMS')
      // console.log('='.repeat(60))
      
      return { success: true }
    } catch (error: any) {
      // console.error('Mock SMS error:', error)
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
    // console.log(`📱 Attempting to send SMS to ${phone}`)
    
    // Try each provider until one succeeds
    for (const provider of this.providers) {
      try {
        // console.log(`🔄 Trying ${provider.name}...`)
        const result = await provider.sendSMS(phone, message)
        
        if (result.success) {
          // console.log(`✅ SMS sent successfully via ${provider.name}`)
          return { 
            success: true, 
            provider: provider.name 
          }
        } else {
          // console.log(`❌ ${provider.name} failed: ${result.error}`)
        }
      } catch (error: any) {
        // console.error(`❌ ${provider.name} error:`, error.message)
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
export const sendBookingNotification = async (phone: string, groundName: string, date: string, startTime: string, endTime: string) => {
  const message = `🎉 NEW BOOKING REQUEST

Ground: ${groundName}
Date: ${new Date(date).toLocaleDateString('en-LK')}
Time: ${formatTimeRange(startTime, endTime)}

Please check your dashboard:
${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings

- Puttalam Grounds`
  return await sendSMS(phone, message)
}

export const sendBookingConfirmation = async (phone: string, groundName: string, date: string, startTime: string, endTime: string) => {
  const message = `✅ BOOKING CONFIRMED

Ground: ${groundName}
Date: ${new Date(date).toLocaleDateString('en-LK')}
Time: ${formatTimeRange(startTime, endTime)}

Thank you for choosing our futsal ground!

- Puttalam Grounds`
  return await sendSMS(phone, message)
}

export const sendBookingConfirmationToCustomer = async (phone: string, groundName: string, date: string, startTime: string, endTime: string, price: number) => {
  const message = `✅ BOOKING CONFIRMED

Ground: ${groundName}
Date: ${new Date(date).toLocaleDateString('en-LK')}
Time: ${formatTimeRange(startTime, endTime)}
Price: Rs.${price.toLocaleString()}

Thank you for choosing our ground!

- ${groundName}`
  return await sendSMS(phone, message)
}

export const sendBookingConfirmationToOwner = async (phone: string, groundName: string, date: string, startTime: string, endTime: string, customerName: string, customerPhone: string, price: number) => {
  const message = `🎉 NEW BOOKING RECEIVED

Ground: ${groundName}
Date: ${new Date(date).toLocaleDateString('en-LK')}
Time: ${formatTimeRange(startTime, endTime)}

Customer Details:
Name: ${customerName}
Phone: ${customerPhone}
Price: Rs.${price.toLocaleString()}

Check your dashboard for more details.
- Puttalam Grounds`
  return await sendSMS(phone, message)
}

export const sendBookingRejection = async (phone: string, groundName: string, date: string, startTime: string, endTime: string) => {
  const message = `❌ BOOKING UNAVAILABLE

Ground: ${groundName}
Date: ${new Date(date).toLocaleDateString('en-LK')}
Time: ${formatTimeRange(startTime, endTime)}

Sorry, this time slot is not available.
Please try another time slot.

- Puttalam Grounds`
  return await sendSMS(phone, message)
}

export const sendOTP = async (phone: string, otp: string) => {
  const message = `🔐 Your OTP code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`
  return await sendSMS(phone, message)
}

export const sendBookingCancellationToCustomer = async (phone: string, customerName: string, groundName: string, date: string, startTime: string, endTime: string, reason: string) => {
  const message = `❌ BOOKING CANCELLED

Dear ${customerName},

Your booking has been cancelled by Puttalam Grounds.

Booking Details:
Ground: ${groundName}
Date: ${new Date(date).toLocaleDateString('en-LK')}
Time: ${formatTimeRange(startTime, endTime)}

Reason: ${reason}

For assistance, contact us at 0773078103.

- Puttalam Grounds Team`
  return await sendSMS(phone, message)
}

export const sendBookingCancellationToOwner = async (phone: string, groundName: string, customerName: string, customerPhone: string, date: string, startTime: string, endTime: string, reason: string) => {
  const message = `❌ BOOKING CANCELLED

Dear Ground Owner,

A booking at your ground has been cancelled by Puttalam Grounds.

Booking Details:
Ground: ${groundName}
Customer: ${customerName}
Phone: ${customerPhone}
Date: ${new Date(date).toLocaleDateString('en-LK')}
Time: ${formatTimeRange(startTime, endTime)}

Reason: ${reason}

- Puttalam Grounds Team`
  return await sendSMS(phone, message)
}

export const sendBookingCancellationToSuperAdmin = async (phone: string, groundName: string, customerName: string, customerPhone: string, date: string, startTime: string, endTime: string, reason: string, cancelledBy: string) => {
  const cancelledByText = cancelledBy === 'GROUND_OWNER' ? 'Ground Owner' : 'Puttalam Grounds'
  const message = `📋 BOOKING CANCELLATION NOTIFICATION

A booking has been cancelled by ${cancelledByText}.

Booking Details:
Ground: ${groundName}
Customer: ${customerName}
Phone: ${customerPhone}
Date: ${new Date(date).toLocaleDateString('en-LK')}
Time: ${formatTimeRange(startTime, endTime)}

Reason: ${reason}

Cancelled by: ${cancelledByText}

- Puttalam Grounds System`
  return await sendSMS(phone, message)
}

export const sendGroundSubmissionSMS = async (phone: string, groundName: string) => {
  const message = `🏟️ GROUND SUBMITTED FOR REVIEW

Dear Ground Owner,

Your ground "${groundName}" has been submitted for review.

Status: Under Review
Next Step: Our team will review your ground and notify you of the decision.

You will receive an SMS once the review is complete.

- Puttalam Grounds Team`
  return await sendSMS(phone, message)
}

export const sendGroundApprovalSMS = async (phone: string, groundName: string) => {
  const message = `✅ GROUND APPROVED

Dear Ground Owner,

Congratulations! Your ground "${groundName}" has been approved and is now live on our platform.

Status: Approved ✅
Your ground is now visible to customers and ready to receive bookings.

You can manage your ground and view bookings in your dashboard.

- Puttalam Grounds Team`
  return await sendSMS(phone, message)
}

export const sendGroundRejectionSMS = async (phone: string, groundName: string, reason: string) => {
  const message = `❌ GROUND REJECTED

Dear Ground Owner,

Unfortunately, your ground "${groundName}" has been rejected.

Status: Rejected ❌
Reason: ${reason}

You can submit a new ground application or contact us for more information.

For assistance, contact us at 0773078103.

- Puttalam Grounds Team`
  return await sendSMS(phone, message)
}