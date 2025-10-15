import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

// Validate required environment variables
if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error('FIREBASE_PROJECT_ID environment variable is required')
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error('FIREBASE_CLIENT_EMAIL environment variable is required')
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('FIREBASE_PRIVATE_KEY environment variable is required')
}

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
}

// Initialize Firebase Admin
const adminApp = getApps().length === 0 ? initializeApp({
  credential: cert(firebaseAdminConfig),
  projectId: firebaseAdminConfig.projectId,
  storageBucket: `${firebaseAdminConfig.projectId}.firebasestorage.app`,
  databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${firebaseAdminConfig.projectId}-default-rtdb.firebaseio.com/`
}) : getApps()[0]

// Initialize Firebase Admin services
export const adminAuth = getAuth(adminApp)
export const adminDb = getFirestore(adminApp)
export const adminStorage = getStorage(adminApp)

export default adminApp