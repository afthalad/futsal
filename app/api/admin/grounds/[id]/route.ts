import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

import { getUserFromToken } from '@/lib/auth'
import { deleteGround, getGroundById } from '@/lib/firestore-server'
import { deleteGroundInMemory, getGroundByIdInMemory } from '@/lib/memory-storage'

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
    
    if (!user || user.role !== 'SUPER_ADMIN') {
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

    // Delete ground
    try {
      await deleteGround(params.id)
    } catch (error) {
      console.error('Error deleting ground from Firestore, using memory storage:', error)
      deleteGroundInMemory(params.id)
    }

    return NextResponse.json({ message: 'Ground deleted successfully' })
  } catch (error) {
    console.error('Delete Ground Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
