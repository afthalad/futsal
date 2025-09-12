import { NextRequest, NextResponse } from 'next/server'
import { getAllGrounds, getAllGroundsWithOwnerInfo, createGround, getBookingsByGround } from '@/lib/firestore-server'
import { getUserFromToken } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const search = searchParams.get('search')
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    let grounds

    // Check if user is authenticated
    if (token) {
      try {
        const user = await getUserFromToken(token)
        
        if (user && user.role === 'GROUND_OWNER') {
          // Ground owner: only show their own grounds
          const { getGroundsByOwner } = await import('@/lib/firestore-server')
          grounds = await getGroundsByOwner(user.id)
          console.log(`🔒 Ground owner ${user.id} accessing their grounds: ${grounds.length} found`)
        } else if (user && user.role === 'SUPER_ADMIN') {
          // Super admin: show all grounds
          grounds = await getAllGroundsWithOwnerInfo()
          console.log(`👑 Super admin accessing all grounds: ${grounds.length} found`)
        } else {
          // Invalid token or role
          grounds = await getAllGroundsWithOwnerInfo()
          console.log(`🌐 Public access to grounds: ${grounds.length} found`)
        }
      } catch (error) {
        console.error('Auth error, falling back to public access:', error)
        // Fallback to public access
        grounds = await getAllGroundsWithOwnerInfo()
        console.log(`🌐 Public access to grounds (fallback): ${grounds.length} found`)
      }
    } else {
      // No token: public access (home page)
      grounds = await getAllGroundsWithOwnerInfo()
      console.log(`🌐 Public access to grounds: ${grounds.length} found`)
    }

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

    // For public access (no token), only show approved grounds
    if (!token) {
      filteredGrounds = filteredGrounds.filter(ground => 
        ground.isActive && ground.status === 'APPROVED'
      )
    }

    // Process grounds data (without booking counts for performance)
    const processedGrounds = filteredGrounds.map((ground) => {
      return {
        ...ground,
        images: ground.images || [],
        amenities: ground.amenities || [],
        // Set default status for existing grounds that don't have it
        status: ground.status || 'PENDING',
        owner:  ground.ownerId,
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
      closingTime: data.closingTime || '22:00',
      status: 'PENDING'
    })

    const ground = {
      id: groundId,
      ...data,
      images: data.images || [],
      amenities: data.amenities || [],
      ownerId: user.id,
      isActive: true,
      openingTime: data.openingTime || '06:00',
      closingTime: data.closingTime || '22:00',
      status: 'PENDING'
    }

    return NextResponse.json({ ground })
  } catch (error) {
    console.error('Create Ground Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
