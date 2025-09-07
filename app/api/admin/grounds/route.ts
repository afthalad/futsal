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

    // Get all grounds with owner information
    const groundsSnapshot = await adminDb.collection('grounds').get()
    const grounds = await Promise.all(
      groundsSnapshot.docs.map(async (doc) => {
        const groundData = doc.data()
        
        // Get owner information
        const ownerDoc = await adminDb.collection('users').doc(groundData.ownerId).get()
        const ownerData = ownerDoc.exists ? ownerDoc.data() : null
        
        return {
          id: doc.id,
          ...groundData,
          owner: {
            name: ownerData?.name,
            phone: ownerData?.phone
          }
        }
      })
    )

    return NextResponse.json({ grounds })
  } catch (error) {
    console.error('Get Grounds Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}