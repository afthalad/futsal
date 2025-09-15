import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getAllGrounds } from '@/lib/firestore-server'
import { adminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { updateDate } = await request.json()

    if (!updateDate) {
      return NextResponse.json({ error: 'Update date is required' }, { status: 400 })
    }

    // Verify the ground owner exists by checking if they have any grounds
    const allGrounds = await getAllGrounds()
    const ownerGrounds = allGrounds.filter(ground => ground.ownerId === params.id)
    
    if (ownerGrounds.length === 0) {
      return NextResponse.json({ error: 'Ground owner not found' }, { status: 404 })
    }

    // Update the due record with the new updateDate
    const dueRef = adminDb.collection('due').doc(params.id)
    await dueRef.update({
      updateDate: new Date(updateDate).toISOString()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Due date updated successfully',
      updateDate: new Date(updateDate).toISOString()
    })
  } catch (error) {
    // console.error('Update Due Date Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
