const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function updateAllBookings() {
  try {
    // Get all bookings
    const bookingsRef = db.collection("bookings");
    const snapshot = await bookingsRef.get();

    // Keep track of progress
    let totalUpdated = 0;
    let totalDocuments = snapshot.size;

    console.log(`Found ${totalDocuments} bookings to update...`);

    // Process in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    let batch = db.batch();
    let count = 0;

    // Loop through all documents
    for (const doc of snapshot.docs) {
      batch.update(doc.ref, {
        isCommissionPaid: false,
        updatedAt: new Date(),
      });

      count++;
      totalUpdated++;

      // When we reach batch size limit, commit and start a new batch
      if (count >= batchSize) {
        await batch.commit();
        console.log(
          `Progress: ${totalUpdated}/${totalDocuments} documents updated...`
        );
        batch = db.batch();
        count = 0;
      }
    }

    // Commit any remaining updates
    if (count > 0) {
      await batch.commit();
    }

    console.log(`Successfully updated all ${totalUpdated} bookings!`);
    process.exit(0);
  } catch (error) {
    console.error("Error updating bookings:", error);
    process.exit(1);
  }
}

// Run the update
console.log("Starting bulk update of all bookings...");
updateAllBookings();
