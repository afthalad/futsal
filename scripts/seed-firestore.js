const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
}

if (!process.env.FIREBASE_PROJECT_ID) {
  console.log('⚠️  Firebase environment variables not set. Please set up your .env.local file first.')
  console.log('📖 See FIREBASE_SETUP.md for instructions.')
  process.exit(1)
}

try {
  const app = initializeApp({
    credential: cert(serviceAccount)
  })
  
  const db = getFirestore(app)
  
  console.log('🌱 Seeding Firestore with default data...')
  
  // Add sample users
  const users = [
    {
      id: 'user_1',
      phone: '+94771234567',
      name: 'John Silva',
      role: 'GROUND_OWNER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'user_2', 
      phone: '+94771234568',
      name: 'Maria Perera',
      role: 'GROUND_OWNER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'admin_1',
      phone: '+94771234569',
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  // Add sample grounds
  const grounds = [
    {
      id: 'ground_1',
      name: 'Colombo Futsal Arena',
      description: 'Premium futsal ground in the heart of Colombo with professional lighting and facilities.',
      location: 'Colombo 03',
      phone: '+94771234567',
      pricePerHour: 2500,
      images: [
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
      ],
      amenities: ['Parking', 'Changing Rooms', 'Water', 'Lighting', 'Sound System'],
      isActive: true,
      ownerId: 'user_1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'ground_2',
      name: 'Kandy Sports Complex',
      description: 'Modern futsal facility in Kandy with air-conditioned changing rooms.',
      location: 'Kandy',
      phone: '+94771234568',
      pricePerHour: 2000,
      images: [
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'
      ],
      amenities: ['Parking', 'Changing Rooms', 'Water', 'Lighting', 'Air Conditioning'],
      isActive: true,
      ownerId: 'user_2',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'ground_3',
      name: 'Galle Beach Futsal',
      description: 'Unique futsal experience near the beach with ocean views.',
      location: 'Galle',
      phone: '+94771234567',
      pricePerHour: 3000,
      images: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
      ],
      amenities: ['Parking', 'Changing Rooms', 'Water', 'Lighting', 'Beach View'],
      isActive: true,
      ownerId: 'user_1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  // Add sample bookings
  const bookings = [
    {
      id: 'booking_1',
      groundId: 'ground_1',
      userId: 'user_2',
      date: '2024-01-15',
      time: '18:00',
      duration: 2,
      totalPrice: 5000,
      status: 'PENDING',
      phone: '+94771234568',
      name: 'Maria Perera',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'booking_2',
      groundId: 'ground_2',
      userId: 'user_1',
      date: '2024-01-16',
      time: '19:00',
      duration: 1,
      totalPrice: 2000,
      status: 'CONFIRMED',
      phone: '+94771234567',
      name: 'John Silva',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'booking_3',
      groundId: 'ground_3',
      userId: 'user_2',
      date: '2024-01-17',
      time: '20:00',
      duration: 2,
      totalPrice: 6000,
      status: 'PENDING',
      phone: '+94771234568',
      name: 'Maria Perera',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  // Add data to Firestore
  async function seedData() {
    try {
      // Add users
      console.log('👥 Adding users...')
      for (const user of users) {
        await db.collection('users').doc(user.id).set(user)
        console.log(`✅ Added user: ${user.name}`)
      }
      
      // Add grounds
      console.log('🏟️ Adding grounds...')
      for (const ground of grounds) {
        await db.collection('grounds').doc(ground.id).set(ground)
        console.log(`✅ Added ground: ${ground.name}`)
      }
      
      // Add bookings
      console.log('📅 Adding bookings...')
      for (const booking of bookings) {
        await db.collection('bookings').doc(booking.id).set(booking)
        console.log(`✅ Added booking: ${booking.id}`)
      }
      
      console.log('🎉 Successfully seeded Firestore with default data!')
      console.log('\n📊 Summary:')
      console.log(`- ${users.length} users added`)
      console.log(`- ${grounds.length} grounds added`)
      console.log(`- ${bookings.length} bookings added`)
      console.log('\n🔗 You can now test the application with this sample data!')
      
    } catch (error) {
      console.error('❌ Error seeding data:', error)
    }
  }
  
  seedData()
  
} catch (error) {
  console.error('❌ Firebase initialization error:', error)
  console.log('\n💡 Make sure you have:')
  console.log('1. Created a Firebase project')
  console.log('2. Set up your .env.local file with Firebase credentials')
  console.log('3. Followed the FIREBASE_SETUP.md instructions')
}
