import { NextRequest, NextResponse } from 'next/server'
import { getMonthlyPayment, calculateMonthlyCommission } from '@/lib/firestore-server'
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

    // Get current month
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const monthString = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    
    // Check if monthly payment record exists for current month
    let monthlyPayment = await getMonthlyPayment(user.id, monthString)
    
    if (!monthlyPayment) {
      // Calculate current month's commission
      const commission = await calculateMonthlyCommission(user.id, currentYear, currentMonth)
      
      return NextResponse.json({
        month: monthString,
        year: currentYear,
        monthNumber: currentMonth,
        totalBookings: commission.totalBookings,
        totalRevenue: commission.totalRevenue,
        commissionAmount: commission.commissionAmount,
        status: 'PENDING',
        isNew: true
      })
    }
    
    return NextResponse.json({
      ...monthlyPayment,
      isNew: false
    })
  } catch (error) {
    console.error('Get Current Month Commission Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
