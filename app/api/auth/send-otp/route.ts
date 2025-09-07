import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

import { sendOTP as sendOTPSMS } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Validate Sri Lankan phone number
    const phoneRegex = /^(0|94)[0-9]{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'Please enter a valid Sri Lankan phone number' }, { status: 400 })
    }

    // Use SMS service for OTP sending (server-side compatible)
    const result = await sendOTPSMS(phone)
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent successfully' 
      })
    } else {
      return NextResponse.json({ 
        error: result.error || 'Failed to send OTP' 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Send OTP Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}