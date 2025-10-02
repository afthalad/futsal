import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

import { getUserFromToken } from '@/lib/auth'
import { deleteGround, getGroundById, getBookingsByGround, updateGround } from '@/lib/firestore-server'
import { deleteGroundInMemory, getGroundByIdInMemory } from '@/lib/memory-storage'

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ground = await getGroundById(params.id)

    if (!ground) {
      return NextResponse.json({ error: 'Ground not found' }, { status: 404 })
    }

    // Process ground data for super admin view
    const processedGround = {
      ...ground,
      images: ground.images || [],
      amenities: ground.amenities || [],
      status: ground.status || 'PENDING'
    }

    return NextResponse.json({ ground: processedGround })
  } catch (error) {
    // console.error('Get Ground Error:', error)
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await request.json()
    
    // Get current ground to check if it exists
    const currentGround = await getGroundById(params.id)
    
    if (!currentGround) {
      return NextResponse.json({ error: 'Ground not found' }, { status: 404 })
    }
    
    // Prepare update data
    const updateData = {
      ...data,
      images: data.images || [],
      amenities: data.amenities || [],
      updatedAt: new Date()
    }
    
    // Super admin can edit any ground without changing its status
    // The status remains as is unless explicitly changed
    await updateGround(params.id, updateData)

    const updatedGround = {
      id: params.id,
      ...updateData,
      images: updateData.images || [],
      amenities: updateData.amenities || []
    }

    return NextResponse.json({ ground: updatedGround })
  } catch (error) {
    // console.error('Update Ground Error:', error)
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
    
    // Debug logging
    // console.log('Delete Ground - User:', user)
    // console.log('Delete Ground - User Role:', user?.role)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      // console.log('Delete Ground - Access denied. User role:', user?.role, 'Expected: SUPER_ADMIN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if ground exists
    let targetGround
    try {
      targetGround = await getGroundById(params.id)
    } catch (error) {
      targetGround = getGroundByIdInMemory(params.id)
    }

    if (!targetGround) {
      return NextResponse.json({ error: 'Ground not found' }, { status: 404 })
    }

    // Check if ground has any bookings
    try {
      const bookings =  (await getBookingsByGround(params.id)).filter(booking => booking.status !== 'CANCELLED' && booking.status !== 'cancelled')
      if (bookings && bookings.length > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete ground with existing bookings. Please cancel all bookings first.' 
        }, { status: 400 })
      }
    } catch (error) {
      // console.error('Error checking bookings:', error)
      // Continue with deletion if we can't check bookings
    }

    // Delete ground
    try {
      await deleteGround(params.id)
    } catch (error) {
      // console.error('Error deleting ground from Firestore, using memory storage:', error)
      deleteGroundInMemory(params.id)
    }

    return NextResponse.json({ message: 'Ground deleted successfully' })
  } catch (error) {
    // console.error('Delete Ground Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
