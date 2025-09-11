import { NextRequest, NextResponse } from 'next/server'
import { 
  getMonthlyPaymentsByOwner, 
  createMonthlyPayment, 
  calculateMonthlyCommission,
  getMonthlyPayment 
} from '@/lib/firestore-server'
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
    
    if (!user || user.role !== 'GROUND_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payments = await getMonthlyPaymentsByOwner(user.id)
    
    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Get Monthly Payments Error:', error)
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

    const { year, month } = await request.json()
    
    if (!year || !month) {
      return NextResponse.json({ error: 'Year and month are required' }, { status: 400 })
    }

    // Check if payment already exists for this month
    const existingPayment = await getMonthlyPayment(user.id, `${year}-${String(month).padStart(2, '0')}`)
    
    if (existingPayment) {
      return NextResponse.json({ error: 'Payment already exists for this month' }, { status: 400 })
    }

    // Calculate commission for the month
    const commission = await calculateMonthlyCommission(user.id, year, month)
    
    if (commission.totalRevenue === 0) {
      return NextResponse.json({ error: 'No bookings found for this month' }, { status: 400 })
    }

    // Create monthly payment record
    const paymentId = await createMonthlyPayment({
      ownerId: user.id,
      month: `${year}-${String(month).padStart(2, '0')}`,
      year,
      monthNumber: month,
      totalBookings: commission.totalBookings,
      totalRevenue: commission.totalRevenue,
      commissionAmount: commission.commissionAmount,
      status: 'PENDING'
    })

    return NextResponse.json({ 
      paymentId,
      commission,
      message: 'Monthly payment record created successfully'
    })
  } catch (error) {
    console.error('Create Monthly Payment Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
