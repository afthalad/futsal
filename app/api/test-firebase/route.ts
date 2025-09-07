import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }

    console.log('🔍 Firebase Environment Check:')
    console.log('FIREBASE_PROJECT_ID:', envCheck.FIREBASE_PROJECT_ID)
    console.log('FIREBASE_CLIENT_EMAIL:', envCheck.FIREBASE_CLIENT_EMAIL)
    console.log('FIREBASE_PRIVATE_KEY:', envCheck.FIREBASE_PRIVATE_KEY)
    console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', envCheck.NEXT_PUBLIC_FIREBASE_PROJECT_ID)

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: 'Firebase environment check completed'
    })
  } catch (error: any) {
    console.error('Firebase test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Firebase test failed',
      details: error.message 
    }, { status: 500 })
  }
}
