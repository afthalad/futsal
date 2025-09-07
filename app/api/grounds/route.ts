import { NextRequest, NextResponse } from 'next/server'
import { getAllGrounds, createGround, getBookingsByGround } from '@/lib/firestore-server'
import { getUserFromToken } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const search = searchParams.get('search')

    // Get all grounds from Firestore (including disabled ones)
    const grounds = await getAllGrounds()

    // Filter by city if provided
    let filteredGrounds = grounds
    if (city) {
      filteredGrounds = grounds.filter(ground => 
        ground.city.toLowerCase().includes(city.toLowerCase())
      )
    }

    // Filter by search term if provided
    if (search) {
      filteredGrounds = filteredGrounds.filter(ground => 
        ground.name.toLowerCase().includes(search.toLowerCase()) ||
        ground.location.toLowerCase().includes(search.toLowerCase()) ||
        ground.city.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Process grounds data (without booking counts for performance)
    const processedGrounds = filteredGrounds.map((ground) => {
      return {
        ...ground,
        images: ground.images || [],
        amenities: ground.amenities || [],
        owner: {
          name: 'Ground Owner', // We'll need to fetch this separately if needed
          phone: ground.phone
        },
        _count: {
          bookings: 0 // Skip booking count for performance
        }
      }
    })

    return NextResponse.json({ grounds: processedGrounds })
  } catch (error) {
    console.error('Get Grounds Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    
    const groundId = await createGround({
      ...data,
      images: data.images || [],
      amenities: data.amenities || [],
      ownerId: user.id,
      isActive: true,
      openingTime: data.openingTime || '06:00',
      closingTime: data.closingTime || '22:00'
    })

    const ground = {
      id: groundId,
      ...data,
      images: data.images || [],
      amenities: data.amenities || [],
      ownerId: user.id,
      isActive: true,
      openingTime: data.openingTime || '06:00',
      closingTime: data.closingTime || '22:00'
    }

    return NextResponse.json({ ground })
  } catch (error) {
    console.error('Create Ground Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
