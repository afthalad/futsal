import { NextRequest, NextResponse } from 'next/server'
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
    
    await updateGround(params.id, {
      ...data,
      images: data.images || [],
      amenities: data.amenities || []
    })

    const ground = {
      id: params.id,
      ...data,
      images: data.images || [],
      amenities: data.amenities || []
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

    await deleteGround(params.id)

    return NextResponse.json({ message: 'Ground deleted successfully' })
  } catch (error) {
    console.error('Delete Ground Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
