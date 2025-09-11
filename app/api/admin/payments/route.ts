import { NextRequest, NextResponse } from 'next/server'
import { getAllMonthlyPayments, getAllUsers } from '@/lib/firestore-server'
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

    const payments = await getAllMonthlyPayments()
    const users = await getAllUsers()
    
    // Filter only ground owners
    const groundOwners = users.filter(user => user.role === 'GROUND_OWNER')
    
    return NextResponse.json({ 
      payments,
      owners: groundOwners
    })
  } catch (error) {
    console.error('Get All Payments Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
