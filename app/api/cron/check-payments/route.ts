import { NextRequest, NextResponse } from 'next/server'
import { markPaymentsAsOverdue, getOverduePayments, getAllGrounds, updateGround } from '@/lib/firestore-server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (you can add API key verification here)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting payment check cron job...')
    
    // Step 1: Mark payments as overdue if it's after the 10th of the month
    const overdueCount = await markPaymentsAsOverdue()
    console.log(`Marked ${overdueCount} payments as overdue`)
    
    // Step 2: Get all overdue payments
    const overduePayments = await getOverduePayments()
    console.log(`Found ${overduePayments.length} overdue payments`)
    
    if (overduePayments.length === 0) {
      return NextResponse.json({ 
        message: 'No overdue payments found',
        overdueCount,
        disabledGrounds: 0
      })
    }

    // Step 3: Get all grounds
    const allGrounds = await getAllGrounds()
    
    // Step 4: Group overdue payments by owner
    const overdueOwners = new Set(overduePayments.map(payment => payment.ownerId))
    
    // Step 5: Find grounds owned by users with overdue payments
    const groundsToDisable = allGrounds.filter(ground => 
      overdueOwners.has(ground.ownerId) && ground.isActive
    )
    
    console.log(`Found ${groundsToDisable.length} grounds to disable`)
    
    // Step 6: Disable grounds for owners with overdue payments
    const disabledGrounds = []
    for (const ground of groundsToDisable) {
      try {
        await updateGround(ground.id, { isActive: false })
        disabledGrounds.push({
          groundId: ground.id,
          groundName: ground.name,
          ownerId: ground.ownerId
        })
        console.log(`Disabled ground: ${ground.name} (${ground.id})`)
      } catch (error) {
        console.error(`Error disabling ground ${ground.id}:`, error)
      }
    }

    console.log(`Payment check cron job completed. Disabled ${disabledGrounds.length} grounds.`)

    return NextResponse.json({
      message: 'Payment check completed successfully',
      overdueCount,
      overduePayments: overduePayments.length,
      disabledGrounds: disabledGrounds.length,
      details: disabledGrounds
    })
  } catch (error) {
    console.error('Payment check cron job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
