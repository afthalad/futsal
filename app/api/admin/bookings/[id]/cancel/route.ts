import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

import { getUserFromToken } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { sendBookingCancellationToCustomer, sendBookingCancellationToOwner } from '@/lib/sms-service'

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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const bookingId = params.id
    const body = await request.json()
    const { reason } = body

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 })
    }

    // Get booking data
    const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get()
    
    if (!bookingDoc.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const bookingData = bookingDoc.data()
    
    // Check if booking is already cancelled
    if (bookingData?.status === 'CANCELLED' || bookingData?.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 })
    }

    // Get ground data for SMS
    let groundData: any = null
    let groundOwnerData: any = null
    if (bookingData?.groundId) {
      const groundDoc = await adminDb.collection('grounds').doc(bookingData.groundId).get()
      if (groundDoc.exists) {
        groundData = { id: groundDoc.id, ...groundDoc.data() }
        
        // Get ground owner data
        if (groundData?.ownerId) {
          const ownerDoc = await adminDb.collection('users').doc(groundData.ownerId).get()
          if (ownerDoc.exists) {
            groundOwnerData = { id: ownerDoc.id, ...ownerDoc.data() }
          }
        }
      }
    }

    // Update booking status
    await adminDb.collection('bookings').doc(bookingId).update({
      status: 'CANCELLED',
      cancellationReason: reason.trim(),
      cancelledAt: new Date(),
      cancelledBy: user.id,
      updatedAt: new Date()
      
    })

    // Send SMS notifications using Text.lk
    try {
      // SMS to customer
      if (bookingData?.customerPhone) {
        const customerResult = await sendBookingCancellationToCustomer(
          bookingData.customerPhone,
          bookingData.customerName || 'Customer',
          groundData?.name || 'Puttalam Grounds',
          bookingData.date || '',
          bookingData.startTime || '',
          bookingData.endTime || '',
          reason
        )
        
        if (customerResult.success) {
          console.log(`✅ Booking cancellation SMS sent to customer via ${customerResult.provider}`)
        } else {
          console.error('❌ Failed to send cancellation SMS to customer:', customerResult.error)
        }
      }

      // SMS to ground owner
      if (groundOwnerData?.phone) {
        const ownerResult = await sendBookingCancellationToOwner(
          groundOwnerData.phone,
          groundData?.name || 'Your Ground',
          bookingData?.customerName || 'N/A',
          bookingData?.customerPhone || 'N/A',
          bookingData?.date || '',
          bookingData?.startTime || '',
          bookingData?.endTime || '',
          reason
        )
        
        if (ownerResult.success) {
          console.log(`✅ Booking cancellation SMS sent to ground owner via ${ownerResult.provider}`)
        } else {
          console.error('❌ Failed to send cancellation SMS to ground owner:', ownerResult.error)
        }
      }

     
     
      
     
    } catch (smsError) {
      console.error('SMS notification failed:', smsError)
      // Don't fail the cancellation if SMS fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Booking cancelled successfully. SMS notifications sent to customer, ground owner, and super admin.'
    })
  } catch (error) {
    console.error('Cancel Booking Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
