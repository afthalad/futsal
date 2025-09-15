import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { markCommissionAsPaid } from '@/lib/firestore-server'

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

    // Mark commission as paid for the ground owner
    await markCommissionAsPaid(params.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Commission marked as paid successfully',
      paidAt: new Date().toISOString()
    })
  } catch (error) {
    // console.error('Mark Commission Paid Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
