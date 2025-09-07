// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

// Initialize Firebase Admin
const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
}

const app = initializeApp(firebaseAdminConfig)
const adminDb = getFirestore(app)

async function createUser(userData) {
  const docRef = await adminDb.collection('users').add({
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  return docRef.id
}

async function getUserByPhone(phone) {
  const q = adminDb.collection('users').where('phone', '==', phone).limit(1)
  const querySnapshot = await q.get()
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() }
  }
  return null
}

async function setupSuperAdmin() {
  try {
    console.log('🔧 Setting up Super Admin...')
    
    const superAdminPhone = '0773078103'
    
    // Check if super admin already exists
    const existingAdmin = await getUserByPhone(superAdminPhone)
    
    if (existingAdmin) {
      console.log('✅ Super Admin already exists:', existingAdmin)
      return
    }
    
    // Create super admin user
    const adminId = await createUser({
      phone: superAdminPhone,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true
    })
    
    console.log('✅ Super Admin created successfully!')
    console.log('📱 Phone:', superAdminPhone)
    console.log('🆔 ID:', adminId)
    console.log('👑 Role: SUPER_ADMIN')
    
  } catch (error) {
    console.error('❌ Error setting up Super Admin:', error)
  }
}

// Run the setup
setupSuperAdmin()
