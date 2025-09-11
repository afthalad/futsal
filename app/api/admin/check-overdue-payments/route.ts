import { NextRequest, NextResponse } from 'next/server'
import { getOverduePayments, getAllGrounds, updateGround } from '@/lib/firestore-server'
import { getUserFromToken } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all overdue payments
    const overduePayments = await getOverduePayments()
    
    if (overduePayments.length === 0) {
      return NextResponse.json({ 
        message: 'No overdue payments found',
        disabledGrounds: []
      })
    }

    // Get all grounds
    const allGrounds = await getAllGrounds()
    
    // Group overdue payments by owner
    const overdueOwners = new Set(overduePayments.map(payment => payment.ownerId))
    
    // Find grounds owned by users with overdue payments
    const groundsToDisable = allGrounds.filter(ground => 
      overdueOwners.has(ground.ownerId) && ground.isActive
    )
    
    // Disable grounds for owners with overdue payments
    const disabledGrounds = []
    for (const ground of groundsToDisable) {
      try {
        await updateGround(ground.id, { isActive: false })
        disabledGrounds.push({
          groundId: ground.id,
          groundName: ground.name,
          ownerId: ground.ownerId
        })
      } catch (error) {
        console.error(`Error disabling ground ${ground.id}:`, error)
      }
    }

    return NextResponse.json({
      message: `Checked ${overduePayments.length} overdue payments`,
      overduePayments: overduePayments.length,
      disabledGrounds: disabledGrounds.length,
      details: disabledGrounds
    })
  } catch (error) {
    console.error('Check Overdue Payments Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
