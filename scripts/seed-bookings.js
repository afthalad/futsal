// scripts/seed-bookings.js
// Seed Firestore with bookings (past + future)
// Requirements:
//   npm i firebase-admin
//   Provide service account via GOOGLE_APPLICATION_CREDENTIALS env or edit serviceAccountPath

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// === CONFIG ===
// Either set process.env.GOOGLE_APPLICATION_CREDENTIALS to your service account file path,
// or set serviceAccountPath to the JSON file path here:
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccountKey.json";

// Firestore collection to add bookings to:
const BOOKINGS_COLLECTION = "bookings";

// Owner and ground ids - provide arrays (script will pick random)
const OWNER_IDS = ["FR5MoMlOgYGSrCSWVBnn"]; // replace with actual owner doc IDs
const GROUND_IDS = ["DxaGqez5U0wrs3Jra8Ph"]; // replace with actual ground doc IDs

// Date range: include past days relative to today, up to yesterday
// Format: YYYY-MM-DD
const START_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 15); // 15 days in the past
  return d.toISOString().split("T")[0];
})();
const END_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1); // yesterday only (exclude today and future)
  return d.toISOString().split("T")[0];
})();

// How many bookings to create total
const TOTAL_BOOKINGS = 315;

// Prices pool (per your request): 3500, 1000, 1500
const PRICE_OPTIONS = [1500];

// Optional: set working hours/time slots (start hour, end hour exclusive)
const START_HOUR = 18; // 18 = 6PM
const END_HOUR = 22; // 22 = 10PM

// Optional statuses
const STATUS = "BOOKED"; // booked bookings count toward unpaid commission

// Optional: random customer names/phones quick pool
const NAMES = ["Ali", "Kamal", "Nadeem", "Saman", "Lakmal", "Ravi", "Aisha"];
const PHONES = [
  "0710000001",
  "0710000002",
  "0710000003",
  "0710000004",
  "0710000005",
];

// === END CONFIG ===

async function main() {
  // Init admin
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

  const start = new Date(START_DATE);
  const end = new Date(END_DATE);

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function dateToYMD(d) {
    return d.toISOString().split("T")[0];
  }

  // Build all dates in range
  const dates = [];
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    dates.push(new Date(dt));
  }

  console.log(
    `Seeding ${TOTAL_BOOKINGS} bookings between ${START_DATE} and ${END_DATE}`
  );
  console.log(`Using prices: ${PRICE_OPTIONS.join(", ")}`);
  console.log(`Owners: ${OWNER_IDS.join(", ")}`);
  console.log(`Grounds: ${GROUND_IDS.join(", ")}`);

  const batchSize = 500; // Firestore batch limit
  let batch = db.batch();
  let ops = 0;
  let created = 0;

  for (let i = 0; i < TOTAL_BOOKINGS; i++) {
    // choose random date (skew to more recent days)
    const idx = Math.floor(Math.pow(Math.random(), 1.2) * dates.length);
    const chosenDate = dates[idx];
    const dateStr = dateToYMD(chosenDate);

    // time slot between START_HOUR and END_HOUR
    const hour = randomInt(START_HOUR, END_HOUR - 1);
    const startTime = `${String(hour).padStart(2, "0")}:00`;
    const endTime = `${String(hour + 1).padStart(2, "0")}:00`;

    const ownerId = randomFrom(OWNER_IDS);
    const groundId = randomFrom(GROUND_IDS);

    const price = randomFrom(PRICE_OPTIONS);

    const customerName =
      randomFrom(NAMES) + " " + Math.floor(Math.random() * 1000);
    const customerPhone = randomFrom(PHONES);

    const docRef = db.collection(BOOKINGS_COLLECTION).doc();

    const payload = {
      ownerId,
      groundId,
      customerName,
      customerPhone,
      date: dateStr,
      startTime,
      endTime,
      price,
      reason: "Seeded booking",
      status: STATUS,
      isCommissionPaid: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.set(docRef, payload);
    ops++;
    created++;

    // commit periodic
    if (ops >= batchSize) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
      console.log(`Committed ${created} bookings so far...`);
    }
  }

  if (ops > 0) {
    await batch.commit();
    console.log(`Committed final batch, total created: ${created}`);
  }

  console.log("Done seeding bookings.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding bookings:", err);
  process.exit(1);
});
