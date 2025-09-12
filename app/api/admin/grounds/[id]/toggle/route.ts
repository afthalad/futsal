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

    const groundId = params.id
    const body = await request.json()
    const reason = body.reason || ''

    // Get current ground data
    const groundDoc = await adminDb.collection('grounds').doc(groundId).get()
    
    if (!groundDoc.exists) {
      return NextResponse.json({ error: 'Ground not found' }, { status: 404 })
    }

    const groundData = groundDoc.data()
    const newStatus = !groundData?.isActive

    // Update ground status with reason
    const updateData: any = {
      isActive: newStatus,
      updatedAt: new Date()
    }

    if (!newStatus && reason) {
      // Only store reason when disabling
      updateData.disableReason = reason
      updateData.disabledAt = new Date()
    } else if (newStatus) {
      // Clear disable reason when enabling
      updateData.disableReason = null
      updateData.disabledAt = null
    }

    await adminDb.collection('grounds').doc(groundId).update(updateData)

    return NextResponse.json({ 
      success: true, 
      isActive: newStatus 
    })
  } catch (error) {
    console.error('Toggle Ground Status Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}