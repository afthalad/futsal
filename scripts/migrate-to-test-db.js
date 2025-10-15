const admin = require('firebase-admin');
const serviceAccount = require('../path-to-your-service-account-key.json'); // Update this path

// Initialize Firebase Admin with test database
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'testfutsal', // Your test database project ID
  databaseURL: 'https://testfutsal-default-rtdb.firebaseio.com/' // Update with your test database URL
});

const db = admin.firestore();

async function migrateGroundsToTestDatabase() {
  try {
    console.log('🔄 Migrating grounds to test database...');
    
    // Get all grounds from the test database
    const groundsSnapshot = await db.collection('grounds').get();
    
    if (groundsSnapshot.empty) {
      console.log('No grounds found in test database. Run init-test-db.js first.');
      return;
    }

    let migratedCount = 0;
    
    for (const doc of groundsSnapshot.docs) {
      const groundData = doc.data();
      
      // Check if ground already has the new fields
      if (groundData.openingTime !== undefined && groundData.closingTime !== undefined) {
        console.log(`⏭️  Ground "${groundData.name}" already has operating hours fields`);
        continue;
      }

      // Add default operating hours if not present
      const updateData = {
        openingTime: groundData.openingTime || '06:00',
        closingTime: groundData.closingTime || '22:00',
        noClosingTime: groundData.noClosingTime || false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await doc.ref.update(updateData);
      console.log(`✅ Updated ground "${groundData.name}" with operating hours`);
      migratedCount++;
    }

    console.log(`🎉 Migration completed! Updated ${migratedCount} grounds.`);
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    process.exit(0);
  }
}

migrateGroundsToTestDatabase();
