import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

import { getUserFromToken } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

export async function PATCH(
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

    // Get current user data
    const userDoc = await adminDb.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const newStatus = !userData?.isActive

    // Update user status
    await adminDb.collection('users').doc(userId).update({
      isActive: newStatus,
      updatedAt: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      isActive: newStatus 
    })
  } catch (error) {
    console.error('Toggle User Status Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}