import { NextRequest, NextResponse } from 'next/server'
import { updateMonthlyPayment, getAllGrounds, updateGround } from '@/lib/firestore-server'
import { getUserFromToken } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: paymentId } = params

    // Update payment status to verified
    await updateMonthlyPayment(paymentId, {
      status: 'VERIFIED',
      verifiedAt: new Date(),
      verifiedBy: user.id
    })

    // Re-enable grounds for this owner if they were disabled due to overdue payments
    // Note: You might want to get the ownerId from the payment record first
    // For now, we'll assume the payment record contains the ownerId
    // You may need to fetch the payment record first to get the ownerId

    return NextResponse.json({ 
      message: 'Payment verified successfully'
    })
  } catch (error) {
    console.error('Verify Payment Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
