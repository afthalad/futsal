const admin = require('firebase-admin');
const serviceAccount = require('../path-to-your-service-account-key.json'); // Update this path

// Initialize Firebase Admin with test database
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'testfutsal', // Your test database project ID
  databaseURL: 'https://testfutsal-default-rtdb.firebaseio.com/' // Update with your test database URL
});

const db = admin.firestore();

async function initializeTestDatabase() {
  try {
    console.log('🚀 Initializing test database...');
    
    // Create a test ground with the new operating hours fields
    const testGround = {
      name: 'Test Futsal Ground',
      description: 'A test ground for development',
      location: 'Test Location, Puttalam',
      city: 'Puttalam',
      phone: '0771234567',
      secondaryPhone: '0777654321',
      images: [],
      amenities: ['Parking', 'Changing Room', 'Water'],
      morningPrice: 2000,
      eveningPrice: 2500,
      nightPrice: 3000,
      openingTime: '06:00',
      closingTime: '22:00',
      noClosingTime: false,
      isActive: true,
      ownerId: 'test-owner-id',
      status: 'APPROVED',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Add test ground
    const groundRef = await db.collection('grounds').add(testGround);
    console.log('✅ Test ground created with ID:', groundRef.id);

    // Create a 24/7 test ground
    const testGround247 = {
      ...testGround,
      name: 'Test 24/7 Futsal Ground',
      location: '24/7 Test Location, Puttalam',
      phone: '0771234568',
      openingTime: '00:00',
      closingTime: '',
      noClosingTime: true
    };

    const ground247Ref = await db.collection('grounds').add(testGround247);
    console.log('✅ 24/7 test ground created with ID:', ground247Ref.id);

    // Create a test user
    const testUser = {
      name: 'Test Ground Owner',
      phone: '0771234567',
      role: 'GROUND_OWNER',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const userRef = await db.collection('users').add(testUser);
    console.log('✅ Test user created with ID:', userRef.id);

    console.log('🎉 Test database initialized successfully!');
    console.log('You can now test the operating hours functionality.');
    
  } catch (error) {
    console.error('❌ Error initializing test database:', error);
  } finally {
    process.exit(0);
  }
}

initializeTestDatabase();
