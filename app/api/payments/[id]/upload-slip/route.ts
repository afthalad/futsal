import { NextRequest, NextResponse } from 'next/server'
import { updateMonthlyPayment, getMonthlyPayment } from '@/lib/firestore-server'
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
    
    if (!user || user.role !== 'GROUND_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { paymentId } = params
    const formData = await request.formData()
    const file = formData.get('paymentSlip') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Payment slip file is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 5MB' 
      }, { status: 400 })
    }

    // Get the payment record to verify ownership
    const payment = await getMonthlyPayment(user.id, paymentId)
    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
    }

    // Upload file to Firebase Storage
    const { uploadFile } = await import('@/lib/firebase-storage')
    const fileUrl = await uploadFile(file, `payment-slips/${user.id}/${paymentId}`)

    // Update payment record with slip URL
    await updateMonthlyPayment(paymentId, {
      paymentSlipUrl: fileUrl,
      paymentSlipUploadedAt: new Date(),
      status: 'PAID'
    })

    return NextResponse.json({ 
      message: 'Payment slip uploaded successfully',
      fileUrl
    })
  } catch (error) {
    console.error('Upload Payment Slip Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
