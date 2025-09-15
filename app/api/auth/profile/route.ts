import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

import { getUserFromToken } from '@/lib/auth'
import { updateUser, adminDb } from '@/lib/firestore-server'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    // console.error('Get Profile Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data = await request.json()
    const { name, phone } = data

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    // Basic phone validation
    const phoneRegex = /^[0-9+\-\s()]+$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Check if phone number is already taken by another user
    if (phone !== user.phone) {
      const existingUserByPhone = await getUserByPhone(phone)
      if (existingUserByPhone && existingUserByPhone.id !== user.id) {
        return NextResponse.json({ error: 'This phone number is already registered with another account' }, { status: 400 })
      }
    }

    // Check if name is already taken by another user
    if (name !== user.name) {
      const existingUserByName = await getUserByName(name)
      if (existingUserByName && existingUserByName.id !== user.id) {
        return NextResponse.json({ error: 'This name is already registered with another account' }, { status: 400 })
      }
    }

    // Update user profile
    const updatedUser = await updateUser(user.id, {
      name: name.trim(),
      phone: phone.trim(),
      updatedAt: new Date()
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    // console.error('Update Profile Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get user by phone
async function getUserByPhone(phone: string) {
  try {
    const usersSnapshot = await adminDb.collection('users').where('phone', '==', phone).limit(1).get()
    
    if (usersSnapshot.empty) {
      return null
    }

    const userDoc = usersSnapshot.docs[0]
    return {
      id: userDoc.id,
      ...userDoc.data()
    }
  } catch (error) {
    // console.error('Error getting user by phone:', error)
    return null
  }
}

// Helper function to get user by name
async function getUserByName(name: string) {
  try {
    const usersSnapshot = await adminDb.collection('users').where('name', '==', name.trim()).limit(1).get()
    
    if (usersSnapshot.empty) {
      return null
    }

    const userDoc = usersSnapshot.docs[0]
    return {
      id: userDoc.id,
      ...userDoc.data()
    }
  } catch (error) {
    // console.error('Error getting user by name:', error)
    return null
  }
}
