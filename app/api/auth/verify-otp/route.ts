import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/auth'
import { getUserByPhone, createUser, User } from '@/lib/firestore-server'
import { getUserByPhoneInMemory, createUserInMemory } from '@/lib/memory-storage'
import { verifyOTP as verifyOTPSMS } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const { phone, otp, name, role = 'GROUND_OWNER' } = await request.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 })
    }

    // Verify OTP using SMS service
    const otpResult = await verifyOTPSMS(phone, otp)
    
    if (!otpResult.success) {
      return NextResponse.json({ error: otpResult.error || 'Invalid OTP' }, { status: 400 })
    }
    
    console.log('✅ OTP verified successfully')
    console.log(`📞 Phone: ${phone}`)

    // Find or create user (Firestore with fallback to memory)
    let user
    try {
      user = await getUserByPhone(phone)
    } catch (error) {
      console.error('Error getting user from Firestore, using memory storage:', error)
      user = getUserByPhoneInMemory(phone)
    }
    
    if (!user) {
      if (!name) {
        return NextResponse.json({ error: 'Name is required for new users' }, { status: 400 })
      }
      
      try {
        // Try to create user in Firestore first
        const userId = await createUser({
          phone,
          name,
          role: role as any,
          isActive: true
        })
        
        user = await getUserByPhone(phone)
        console.log('✅ User created in Firestore:', user)
      } catch (error) {
        console.error('Error creating user in Firestore, using memory storage:', error)
        // Fallback to memory storage
        const userId = createUserInMemory({
          phone,
          name,
          role: role as any,
          isActive: true
        })
        
        user = getUserByPhoneInMemory(phone)
        console.log('✅ User created in memory:', user)
      }
    } else {
      console.log('✅ User found:', user)
      
      // If user exists but doesn't have a name, require name completion
      if (!user.name && !name) {
        return NextResponse.json({ error: 'Name is required for existing users without profile' }, { status: 400 })
      }
      
      // If user exists and has a name, they can proceed directly
      if (user.name) {
        console.log('✅ Existing user with complete profile, proceeding to login')
      }
    }

    // Generate JWT token
    const token = generateToken({
      userId: user!.id,
      phone: user!.phone,
      role: user!.role
    })

    return NextResponse.json({
      token,
      user: {
        id: user!.id,
        phone: user!.phone,
        name: user!.name,
        role: user!.role
      }
    })
  } catch (error) {
    console.error('Verify OTP Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
