import { NextRequest, NextResponse } from 'next/server'
import { 
  getAllBookings, 
  getGroundsByOwner, 
  calculateMonthlyCommission, 
  getMonthlyPayment, 
  createMonthlyPayment 
} from '@/lib/firestore-server'
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
    
    if (!user || user.role !== 'GROUND_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { year, month } = await request.json()
    
    if (!year || !month) {
      return NextResponse.json({ error: 'Year and month are required' }, { status: 400 })
    }

    const monthString = `${year}-${String(month).padStart(2, '0')}`
    
    // Check if commission record already exists
    const existingPayment = await getMonthlyPayment(user.id, monthString)
    
    if (existingPayment) {
      return NextResponse.json({ 
        message: 'Commission record already exists for this month',
        commission: existingPayment
      })
    }

    // Calculate commission for the specified month
    const commission = await calculateMonthlyCommission(user.id, year, month)
    
    if (commission.totalRevenue === 0) {
      return NextResponse.json({ 
        message: 'No bookings found for this month',
        commission: { totalBookings: 0, totalRevenue: 0, commissionAmount: 0 }
      })
    }

    // Create monthly payment record
    const paymentId = await createMonthlyPayment({
      ownerId: user.id,
      month: monthString,
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
      message: 'Commission record created successfully'
    })
  } catch (error) {
    console.error('Initialize Commission Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to initialize all missing commission records for a ground owner
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

    // Get all bookings for this ground owner
    const grounds = await getGroundsByOwner(user.id)
    const groundIds = grounds.map(ground => ground.id)
    
    if (groundIds.length === 0) {
      return NextResponse.json({ 
        message: 'No grounds found for this owner',
        created: []
      })
    }

    const allBookings = await getAllBookings()
    const ownerBookings = allBookings.filter(booking => 
      groundIds.includes(booking.groundId) && 
      booking.status !== 'CANCELLED' && 
      booking.status !== 'cancelled'
    )

    // Group bookings by month
    const bookingsByMonth: { [key: string]: any[] } = {}
    
    ownerBookings.forEach(booking => {
      const bookingDate = new Date(booking.date)
      const year = bookingDate.getFullYear()
      const month = bookingDate.getMonth() + 1
      const monthKey = `${year}-${String(month).padStart(2, '0')}`
      
      if (!bookingsByMonth[monthKey]) {
        bookingsByMonth[monthKey] = []
      }
      bookingsByMonth[monthKey].push(booking)
    })

    const created = []
    
    // Create commission records for each month with bookings
    for (const [monthKey, bookings] of Object.entries(bookingsByMonth)) {
      const [year, month] = monthKey.split('-')
      
      // Check if commission record already exists
      const existingPayment = await getMonthlyPayment(user.id, monthKey)
      
      if (!existingPayment && bookings.length > 0) {
        const commission = await calculateMonthlyCommission(user.id, parseInt(year), parseInt(month))
        
        if (commission.totalRevenue > 0) {
          const paymentId = await createMonthlyPayment({
            ownerId: user.id,
            month: monthKey,
            year: parseInt(year),
            monthNumber: parseInt(month),
            totalBookings: commission.totalBookings,
            totalRevenue: commission.totalRevenue,
            commissionAmount: commission.commissionAmount,
            status: 'PENDING'
          })
          
          created.push({
            month: monthKey,
            paymentId,
            commission
          })
        }
      }
    }

    return NextResponse.json({ 
      message: `Created ${created.length} commission records`,
      created
    })
  } catch (error) {
    console.error('Initialize All Commissions Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
