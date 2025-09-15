import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { adminDb } from '@/lib/firebase-admin'
import jwt from 'jsonwebtoken'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { phone, idToken, name, role = 'GROUND_OWNER' } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    if (!idToken) {
      return NextResponse.json({ error: 'Firebase ID token is required' }, { status: 400 })
    }

    let user: any = null
    let isNewUser = false

    try {
      // Verify Firebase ID token
      const decodedToken = await adminAuth.verifyIdToken(idToken)
      
      // Check if phone number matches
      const expectedPhone = `+94${phone.replace(/^0/, '')}`
      if (decodedToken.phone_number !== expectedPhone) {
        return NextResponse.json({ error: 'Phone number mismatch' }, { status: 400 })
      }

      // console.log('✅ Firebase ID token verified successfully')
      // console.log(`📞 Phone: ${phone}`)
      // console.log(`🆔 Firebase UID: ${decodedToken.uid}`)

      // Check if user exists in Firestore
      const userQuery = await adminDb.collection('users')
        .where('phone', '==', phone)
        .limit(1)
        .get()

      if (userQuery.empty) {
        // New user - create account
        isNewUser = true
        // console.log('🆕 Creating new user in Firestore')
        
        if (!name) {
          return NextResponse.json({ error: 'Name is required for new users' }, { status: 400 })
        }

        const newUser = {
          phone,
          name,
          role,
          isActive: true,
          firebaseUid: decodedToken.uid, // Store Firebase UID for reference
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const userRef = await adminDb.collection('users').add(newUser)
        user = { id: userRef.id, ...newUser }
        // console.log('✅ User created in Firestore:', user)
      } else {
        // Existing user
        const userDoc = userQuery.docs[0]
        user = { id: userDoc.id, ...userDoc.data() }
        // console.log('✅ Existing user found:', user)
        
        // Check if user needs to complete profile
        if (!user.name && name) {
          await adminDb.collection('users').doc(user.id).update({
            name,
            firebaseUid: decodedToken.uid, // Update Firebase UID
            updatedAt: new Date()
          })
          user.name = name
          // console.log('✅ User profile updated with name')
        } else if (!user.name) {
          return NextResponse.json({ error: 'Name is required for existing users without profile' }, { status: 400 })
        }
      }
    } catch (error) {
      // console.error('Firebase token verification error:', error)
      return NextResponse.json({ error: 'Invalid Firebase token' }, { status: 400 })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        phone: user.phone, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    return NextResponse.json({ 
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      }
    })
  } catch (error) {
    // console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
