import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

import { getUserFromToken } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const userId = params.id

    // Get user data
    const userDoc = await adminDb.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()

    return NextResponse.json({ 
      user: { id: userDoc.id, ...userData }
    })
  } catch (error) {
    console.error('Get User Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const userId = params.id
    const body = await request.json()
    const { name, phone, role, isActive } = body

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    // Validate phone number format
    const phoneRegex = /^(0|94)[0-9]{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Check if phone number is already taken by another user
    const phoneQuery = await adminDb.collection('users')
      .where('phone', '==', phone)
      .where('__name__', '!=', userId)
      .limit(1)
      .get()

    if (!phoneQuery.empty) {
      return NextResponse.json({ error: 'Phone number is already taken by another user' }, { status: 400 })
    }

    // Get current user data
    const userDoc = await adminDb.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentUserData = userDoc.data()
    const wasActive = currentUserData?.isActive
    const isNowActive = isActive

    // Prepare update data
    const updateData: any = {
      name: name.trim(),
      phone: phone.trim(),
      role: role || 'GROUND_OWNER',
      isActive: isNowActive,
      updatedAt: new Date()
    }

    // Handle status change
    if (!wasActive && isNowActive) {
      // User is being enabled - clear disable reason
      updateData.disableReason = null
      updateData.disabledAt = null
    } else if (wasActive && !isNowActive) {
      // User is being disabled - this should go through the toggle endpoint with reason
      return NextResponse.json({ 
        error: 'Please use the disable button to disable users with a reason' 
      }, { status: 400 })
    }

    // Update user
    await adminDb.collection('users').doc(userId).update(updateData)

    return NextResponse.json({ 
      success: true,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Update User Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}