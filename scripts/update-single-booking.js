const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function updateSingleBooking(bookingId) {
  try {
    const bookingRef = db.collection("bookings").doc(bookingId);

    // Update the document
    await bookingRef.update({
      isCommissionPaid: false,
      updatedAt: new Date(),
    });

    // console.log(`Successfully updated booking ${bookingId}`);
    process.exit(0);
  } catch (error) {
    // console.error("Error updating booking:", error);
    process.exit(1);
  }
}

// Get the booking ID from command line argument
const bookingId = process.argv[2];

if (!bookingId) {
  //   console.error("Please provide a booking ID as an argument");
  //   console.log("Usage: node update-single-booking.js BOOKING_ID");
  process.exit(1);
}

// Run the update
updateSingleBooking(bookingId);
