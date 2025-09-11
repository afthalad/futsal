import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getAllGrounds, getUserById } from '@/lib/firestore-server'
import { adminDb } from '@/lib/firebase-admin'

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

    // Get all grounds to get ground owners
    const allGrounds = await getAllGrounds()
    const uniqueOwners = Array.from(new Set(allGrounds.map(ground => ground.ownerId)))
    // Get commission data for each ground owner
    const commissions = await Promise.all(
      uniqueOwners.map(async (ownerId) => {
        try {
          const commissionRef = adminDb.collection('commission').doc(ownerId)
          const commissionDoc = await commissionRef.get()
          
          const owner = await getUserById(ownerId)
          const ownerGrounds = allGrounds.filter(ground => ground.ownerId === ownerId)
          
          if (commissionDoc.exists) {
            const commissionData = commissionDoc.data()
            return {
              id: ownerId,
              ownerId,
              ownerName: owner?.name || 'Unknown',
              ownerPhone: owner?.phone || 'N/A',
              groundCount: ownerGrounds.length,
              groundNames: ownerGrounds.map(g => g.name).join(', '),
              amount: commissionData?.amount || 0,
              status: commissionData?.status || 'PAID',
              lastUpdated: commissionData?.lastUpdated?.toDate?.() || new Date(),
              paidAt: commissionData?.paidAt?.toDate?.() || null
            }
          } else {
            // No commission record exists, create one with 0 amount
            return {
              id: ownerId,
              ownerId,
              ownerName: owner?.name || 'Unknown',
              ownerPhone: owner?.phone || 'N/A',
              groundCount: ownerGrounds.length,
              groundNames: ownerGrounds.map(g => g.name).join(', '),
              amount: 0,
              status: 'PAID',
              lastUpdated: new Date(),
              paidAt: null
            }
          }
        } catch (error) {
          console.error(`Error processing owner ${ownerId}:`, error)
          return null
        }
      })
    )

    // Filter out null values and sort by amount (highest first)
    const validCommissions = commissions
      .filter(commission => commission !== null)
      .sort((a, b) => b.amount - a.amount)

    return NextResponse.json({ 
      commissions: validCommissions,
      totalAmount: validCommissions.reduce((sum, c) => sum + c.amount, 0),
      pendingCount: validCommissions.filter(c => c.status === 'PENDING').length
    })
  } catch (error) {
    console.error('Get Commissions Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
