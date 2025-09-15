import { NextRequest, NextResponse } from 'next/server'
import { getAllBookings, getGroundById } from '@/lib/firestore-server'
import { getUserFromToken } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bookings = await getAllBookings()

    // Add ground details to each booking
    const bookingsWithGrounds = await Promise.all(
      bookings.map(async (booking) => {
        const ground = await getGroundById(booking.groundId)
        return {
          ...booking,
          ground: ground ? {
            name: ground.name,
            location: ground.location,
            city: ground.city
          } : null
        }
      })
    )

    return NextResponse.json({ bookings: bookingsWithGrounds })
  } catch (error) {
    // console.error('Get Bookings Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
