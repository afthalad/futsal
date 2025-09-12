const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Add your Firebase project configuration here
  });
}

const db = admin.firestore();

async function migrateGroundStatus() {
  try {
    console.log('Starting ground status migration...');
    
    // Get all grounds
    const groundsSnapshot = await db.collection('grounds').get();
    
    if (groundsSnapshot.empty) {
      console.log('No grounds found to migrate.');
      return;
    }

    console.log(`Found ${groundsSnapshot.size} grounds to check.`);
    
    const batch = db.batch();
    let updateCount = 0;

    groundsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      
      // Check if ground already has status field
      if (!data.status) {
        console.log(`Updating ground ${doc.id} (${data.name}) - adding PENDING status`);
        
        batch.update(doc.ref, {
          status: 'PENDING',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updateCount++;
      } else {
        console.log(`Ground ${doc.id} (${data.name}) already has status: ${data.status}`);
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`Successfully updated ${updateCount} grounds with PENDING status.`);
    } else {
      console.log('No grounds needed status updates.');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration
migrateGroundStatus().then(() => {
  console.log('Migration script finished.');
  process.exit(0);
}).catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});
