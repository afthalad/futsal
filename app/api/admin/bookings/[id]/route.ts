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

    const bookingId = params.id

    // Get booking data
    const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get()
    
    if (!bookingDoc.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const bookingData = bookingDoc.data()
    
    // Get ground data
    let groundData = null
    if (bookingData?.groundId) {
      const groundDoc = await adminDb.collection('grounds').doc(bookingData.groundId).get()
      if (groundDoc.exists) {
        groundData = { id: groundDoc.id, ...groundDoc.data() }
      }
    }

    return NextResponse.json({ 
      booking: { 
        id: bookingDoc.id, 
        ...bookingData,
        ground: groundData
      }
    })
  } catch (error) {
    // console.error('Get Booking Error:', error)
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

    const bookingId = params.id
    const body = await request.json()
    const { customerName, customerPhone, date, startTime, endTime, groundId, price } = body

    // Validate required fields
    if (!customerName || !customerPhone || !date || !startTime || !endTime || !groundId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Validate phone number format
    const phoneRegex = /^(0|94)[0-9]{9}$/
    if (!phoneRegex.test(customerPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Get current booking data
    const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get()
    
    if (!bookingDoc.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if booking is already cancelled
    const currentBooking = bookingDoc.data()
    if (currentBooking?.status === 'CANCELLED' || currentBooking?.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot edit cancelled booking' }, { status: 400 })
    }

    // Update booking
    await adminDb.collection('bookings').doc(bookingId).update({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      date,
      startTime,
      endTime,
      groundId,
      price: price || 0,
      updatedAt: new Date()
    })

    return NextResponse.json({ 
      success: true,
      message: 'Booking updated successfully'
    })
  } catch (error) {
    // console.error('Update Booking Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
