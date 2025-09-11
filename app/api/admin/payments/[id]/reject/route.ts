import { NextRequest, NextResponse } from 'next/server'
import { updateMonthlyPayment } from '@/lib/firestore-server'
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

    // Update payment status back to pending (reject the payment slip)
    await updateMonthlyPayment(paymentId, {
      status: 'PENDING',
      paymentSlipUrl: undefined,
      paymentSlipUploadedAt: undefined
    })

    return NextResponse.json({ 
      message: 'Payment rejected successfully'
    })
  } catch (error) {
    console.error('Reject Payment Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
