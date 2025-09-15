import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { updateGround } from '@/lib/firestore-server'
import { sendGroundApprovalSMS, sendGroundRejectionSMS } from '@/lib/sms-service'

export const dynamic = 'force-dynamic'

export async function POST(
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { action, reason } = await request.json()
    
    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be APPROVE or REJECT' }, { status: 400 })
    }

    if (action === 'REJECT' && !reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    const groundId = params.id
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
    
    // Update ground status
    const updateData: any = {
      status,
      reviewedBy: user.id,
      reviewedAt: new Date()
    }

    if (action === 'REJECT') {
      updateData.rejectionReason = reason
    }

    await updateGround(groundId, updateData)

    // Get ground details for SMS notification
    const { getGroundById } = await import('@/lib/firestore-server')
    const ground = await getGroundById(groundId)
    
    if (ground) {
      // Get ground owner details for SMS
      const { getUserById } = await import('@/lib/firestore-server')
      const owner = await getUserById(ground.ownerId)
      
      if (owner) {
        // DISABLED: SMS notifications temporarily disabled for release
        /*
        try {
          if (action === 'APPROVE') {
            await sendGroundApprovalSMS(owner.phone, ground.name)
          } else {
            await sendGroundRejectionSMS(owner.phone, ground.name, reason)
          }
        } catch (smsError) {
          // console.error('Failed to send SMS notification:', smsError)
          // Don't fail the request if SMS fails
        }
        */
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Ground ${action.toLowerCase()}d successfully` 
    })
  } catch (error) {
    // console.error('Ground review error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
