import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

import { getGroundById, updateGround, deleteGround, getBookingsByGround } from '@/lib/firestore-server'
import { getUserFromToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ground = await getGroundById(params.id)

    if (!ground) {
      return NextResponse.json({ error: 'Ground not found' }, { status: 404 })
    }

    // Get bookings for this ground
    const bookings = await getBookingsByGround(params.id)
    // Include only active bookings (exclude cancelled bookings)
    const activeBookings = bookings.filter(booking => 
      booking.status !== 'CANCELLED' && booking.status !== 'cancelled'
    )

    // Process ground data
    const processedGround = {
      ...ground,
      images: ground.images || [],
      amenities: ground.amenities || [],
      // Set default status for existing grounds that don't have it
      status: ground.status || 'PENDING',
      owner: {
        name: 'Ground Owner', // We'll need to fetch this separately if needed
        phone: ground.phone
      },
      bookings: activeBookings.map(booking => ({
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        status: booking.status,
        reason: booking.reason,
        cancellationReason: booking.cancellationReason,
        cancelledAt: booking.cancelledAt,
        cancelledBy: booking.cancelledBy
      }))
    }

    return NextResponse.json({ ground: processedGround })
  } catch (error) {
    console.error('Get Ground Error:', error)
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
    
    if (!user || user.role !== 'GROUND_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await request.json()
    
    // Get current ground to check status
    const currentGround = await getGroundById(params.id)
    
    // If ground was rejected and owner is editing, reset to PENDING for re-review
    const updateData = {
      ...data,
      images: data.images || [],
      amenities: data.amenities || []
    }
    
    // Reset status to PENDING if ground was previously rejected
    if (currentGround && currentGround.status === 'REJECTED') {
      updateData.status = 'PENDING'
      updateData.rejectionReason = null // Clear rejection reason
      updateData.reviewedBy = null // Clear previous reviewer
      updateData.reviewedAt = null // Clear review timestamp
    }
    
    await updateGround(params.id, updateData)

    const ground = {
      id: params.id,
      ...updateData,
      images: updateData.images || [],
      amenities: updateData.amenities || []
    }

    return NextResponse.json({ ground })
  } catch (error) {
    console.error('Update Ground Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Check if ground exists and belongs to the user
    const ground = await getGroundById(params.id)
    if (!ground) {
      return NextResponse.json({ error: 'Ground not found' }, { status: 404 })
    }

    if (ground.ownerId !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own grounds' }, { status: 403 })
    }

    // Check if ground has any bookings
    const bookings = await getBookingsByGround(params.id)
    if (bookings && bookings.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete ground with existing bookings. Please cancel all bookings first.' 
      }, { status: 400 })
    }

    await deleteGround(params.id)

    return NextResponse.json({ message: 'Ground deleted successfully' })
  } catch (error) {
    console.error('Delete Ground Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
