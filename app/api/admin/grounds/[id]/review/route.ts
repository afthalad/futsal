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
    
    if (!action || !['APPROVE', 'REJECT', 'SEND_TO_REVIEW'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be APPROVE, REJECT, or SEND_TO_REVIEW' }, { status: 400 })
    }

    if (action === 'REJECT' && !reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    const groundId = params.id
    let status: string
    let updateData: any = {
      reviewedBy: user.id,
      reviewedAt: new Date()
    }

    if (action === 'APPROVE') {
      status = 'APPROVED'
      updateData.status = status
    } else if (action === 'REJECT') {
      status = 'REJECTED'
      updateData.status = status
      updateData.rejectionReason = reason
    } else if (action === 'SEND_TO_REVIEW') {
      status = 'PENDING'
      updateData.status = status
      // Clear previous review data when sending back to review
      updateData.rejectionReason = null
      updateData.reviewedBy = null
      updateData.reviewedAt = null
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

    let message: string
    if (action === 'SEND_TO_REVIEW') {
      message = 'Ground sent back to review successfully'
    } else {
      message = `Ground ${action.toLowerCase()}d successfully`
    }

    return NextResponse.json({ 
      success: true, 
      message 
    })
  } catch (error) {
    // console.error('Ground review error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
