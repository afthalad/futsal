/**
 * scripts/debug-owner-commission.js
 *
 * Quick tool to check unpaid commissions for a given ground owner.
 * Usage:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\\path\\to\\serviceAccountKey.json'
 *   node .\scripts\debug-owner-commission.js <OWNER_ID>
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// --- 1. Setup Firebase Admin ---
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, "..", "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Service account file not found at", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(path.resolve(serviceAccountPath));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// --- 2. Get owner ID ---
const OWNER_ID = process.argv[2];
if (!OWNER_ID) {
  console.error("Usage: node scripts/debug-owner-commission.js <OWNER_ID>");
  process.exit(1);
}

const SPECIAL_OWNER_ID = "eq9ywFOCOlqEkUBUaDeh";

// --- 3. Helper: calculate commission for a booking ---
function getCommission(b) {
  if (b.ownerId === SPECIAL_OWNER_ID) {
    return Math.round(Number(b.price || 0) * 0.01 * 100) / 100; // 1%
  }
  return 50; // Flat commission
}

// --- 4. Run main logic ---
(async () => {
  console.log("🔍 Checking commission for owner:", OWNER_ID);
  console.log("------------------------------------------------------");

  // --- Fetch all bookings for owner ---
  const bookingsSnap = await db
    .collection("bookings")
    .where("ownerId", "==", OWNER_ID)
    .where("status", "==", "BOOKED")
    .get();

  const allBookings = bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log(`Total BOOKED bookings: ${allBookings.length}`);

  // --- Filter unpaid bookings only ---
  const unpaidBookings = allBookings.filter(
    (b) => b.isCommissionPaid !== true // not paid yet
  );

  // --- Filter only up to yesterday ---
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const unpaidUntilYesterday = unpaidBookings.filter(
    (b) => b.date && b.date <= yesterdayStr
  );

  console.log(
    `Unpaid bookings (up to ${yesterdayStr}): ${unpaidUntilYesterday.length}`
  );

  unpaidUntilYesterday.forEach((b) => {
    const c = getCommission(b);
    console.log(` - ${b.id} | ${b.date} | ${b.price} | comm: ${c}`);
  });

  const unpaidTotal = unpaidUntilYesterday.reduce(
    (sum, b) => sum + getCommission(b),
    0
  );

  // --- Fetch payment records ---
  const paySnap = await db
    .collection("payments")
    .where("ownerId", "==", OWNER_ID)
    .orderBy("createdAt", "desc")
    .get();

  const payments = paySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log(`\nPayments found: ${payments.length}`);

  payments.forEach((p) => {
    console.log(
      ` - ${p.id} | paid: ${p.amountPaid} | applied: ${p.amountApplied} | remaining: ${p.amountRemaining} | cutoff: ${p.cutoffDate}`
    );
  });

  const remainingTotal = payments.reduce(
    (sum, p) => sum + Number(p.amountRemaining || 0),
    0
  );

  const totalDue = Math.round((unpaidTotal + remainingTotal) * 100) / 100;

  console.log("\nSummary:");
  console.log("------------------------------------------------------");
  console.log("🧾 Unpaid commission (until yesterday):", unpaidTotal);
  console.log("💰 Remaining from partial payments:", remainingTotal);
  console.log("📊 TOTAL DUE:", totalDue);
  console.log("------------------------------------------------------");

  console.log(
    "\nUnpaid booking IDs:",
    unpaidUntilYesterday.map((b) => b.id)
  );
  console.log(
    "Payment IDs:",
    payments.map((p) => p.id)
  );

  process.exit(0);
})();
