// scripts/delete-seeded-bookings.js
// Safely delete bookings where reason == "Seeded booking"
// Usage:
// 1) Dry-run (default) - lists how many documents would be deleted and sample ids:
//    node delete-seeded-bookings.js
// 2) Confirm delete - set env var CONFIRM_DELETE=1 or pass --delete
//    CONFIRM_DELETE=1 node delete-seeded-bookings.js
// Requirements:
//   npm i firebase-admin
//   Provide service account via GOOGLE_APPLICATION_CREDENTIALS env or edit serviceAccountPath

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// === CONFIG ===
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccountKey.json";
const BOOKINGS_COLLECTION = "bookings";
const BATCH_SIZE = 5; // Firestore batch limit
const MATCH_REASON = "Seeded booking";

async function main() {
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Service account file not found at ${serviceAccountPath}`);
    console.error(
      "Set environment variable GOOGLE_APPLICATION_CREDENTIALS or update serviceAccountPath in the script."
    );
    process.exit(1);
  }

  const serviceAccount = require(path.resolve(serviceAccountPath));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();

  const doDelete =
    process.argv.includes("--delete") || process.env.CONFIRM_DELETE === "1";

  console.log(
    `Searching for documents in '${BOOKINGS_COLLECTION}' where reason == "${MATCH_REASON}"...`
  );

  // Count matching documents but avoid reading entire large collection at once
  let totalFound = 0;
  const sampleIds = [];

  // We'll page through the query using limit; note this reads documents but is safe for moderate sizes.
  let lastDoc = null;
  while (true) {
    let q = db
      .collection(BOOKINGS_COLLECTION)
      .where("reason", "==", MATCH_REASON)
      .orderBy("__name__")
      .limit(BATCH_SIZE);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;
    snap.docs.forEach((doc) => {
      totalFound += 1;
      if (sampleIds.length < 10) sampleIds.push(doc.id);
    });
    lastDoc = snap.docs[snap.docs.length - 1];
    // If fewer than batch, we've reached end
    if (snap.size < BATCH_SIZE) break;
  }

  console.log(
    `Found ${totalFound} documents matching reason == "${MATCH_REASON}"`
  );
  if (sampleIds.length > 0) {
    console.log("Sample doc ids:", sampleIds.join(", "));
  }

  if (!doDelete) {
    console.log(
      "\nDRY RUN (no deletes performed). To delete, re-run with env var or --delete flag:"
    );
    console.log("  CONFIRM_DELETE=1 node scripts/delete-seeded-bookings.js");
    console.log("  or: node scripts/delete-seeded-bookings.js --delete");
    process.exit(0);
  }

  if (totalFound === 0) {
    console.log("No documents to delete. Exiting.");
    process.exit(0);
  }

  console.log("\nDeleting documents in batches...");

  // Delete in batches: query again and delete up to BATCH_SIZE per loop
  let deleted = 0;
  while (true) {
    const snap = await db
      .collection(BOOKINGS_COLLECTION)
      .where("reason", "==", MATCH_REASON)
      .limit(BATCH_SIZE)
      .get();
    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snap.size;
    console.log(`Deleted ${deleted} / ~${totalFound}`);
    // short pause to avoid hammering
    await new Promise((res) => setTimeout(res, 200));
  }

  console.log(
    `Done. Deleted ${deleted} documents where reason == "${MATCH_REASON}"`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Error during deletion:", err);
  process.exit(1);
});
