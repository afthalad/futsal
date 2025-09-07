import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

import { getUserFromToken } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all users from Firestore
    const usersSnapshot = await adminDb.collection('users').get()
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get Users Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}