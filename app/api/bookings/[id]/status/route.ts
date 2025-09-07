import { NextRequest, NextResponse } from 'next/server'
import { getBookingById, updateBooking, getGroundById } from '@/lib/firestore-server'
import { getUserFromToken } from '@/lib/auth'
import { sendBookingConfirmation } from '@/lib/sms'

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
    
    if (!user || user.role !== 'GROUND_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { status } = await request.json()

    if (!['PENDING', 'ACCEPTED', 'REJECTED', 'BOOKED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get booking with ground details
    const booking = await getBookingById(params.id)

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Get ground details
    const ground = await getGroundById(booking.groundId)

    if (!ground) {
      return NextResponse.json({ error: 'Ground not found' }, { status: 404 })
    }

    // Check if user owns this ground
    if (ground.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update booking status
    await updateBooking(params.id, { status: status as any })

    const updatedBooking = {
      ...booking,
      status: status as any,
      ground: {
        name: ground.name,
        location: ground.location
      }
    }

    // Send confirmation SMS to customer if accepted
    if (status === 'ACCEPTED') {
      await sendBookingConfirmation(
        booking.customerPhone,
        ground.name,
        booking.date,
        `${booking.startTime} - ${booking.endTime}`
      )
    }

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error('Update Booking Status Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
