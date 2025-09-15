import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

import { sendSMS } from '@/lib/sms-service'

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json()

    if (!phone || !message) {
      return NextResponse.json({ 
        error: 'Phone number and message are required' 
      }, { status: 400 })
    }

    // Validate Sri Lankan phone number format
    const phoneRegex = /^(0|94)[0-9]{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({
        error: 'Please enter a valid Sri Lankan phone number (10 digits starting with 0)'
      }, { status: 400 })
    }

    // Send SMS
    const result = await sendSMS(phone, message)

    if (result.success) {
      return NextResponse.json({
        message: 'SMS sent successfully',
        provider: result.provider
      })
    } else {
      return NextResponse.json({
        error: result.error || 'Failed to send SMS'
      }, { status: 500 })
    }
  } catch (error) {
    // console.error('Test SMS Error:', error)
    return NextResponse.json({
      error: 'Failed to send SMS. Please try again later.'
    }, { status: 500 })
  }
}
