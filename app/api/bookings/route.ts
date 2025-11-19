import { NextRequest, NextResponse } from "next/server";
import {
  getAllBookings,
  getBookingsByUser,
  getBookingsByGround,
  createBooking,
  getGroundById,
  getGroundsByOwner,
  updateCommissionAmount,
} from "@/lib/firestore-server";
import { getUserFromToken } from "@/lib/auth";
import {
  sendBookingConfirmationToCustomer,
  sendBookingConfirmationToOwner,
} from "@/lib/sms-service";
import { isMorningSlot, isEveningSlot, isNightSlot } from "@/lib/utils";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    let bookings = [];

    if (user.role === "GROUND_OWNER") {
      // Get all grounds owned by this user
      const userGrounds = await getGroundsByOwner(user.id);
      const userGroundIds = userGrounds.map((ground) => ground.id);

      // Get all bookings and filter by user's grounds
      const allBookings = await getAllBookings();
      bookings = allBookings.filter((booking) =>
        userGroundIds.includes(booking.groundId)
      );
    } else if (user.role === "USER") {
      bookings = await getBookingsByUser(user.id);
    } else {
      bookings = await getAllBookings();
    }

    // Add ground details to each booking
    const bookingsWithGrounds = await Promise.all(
      bookings.map(async (booking) => {
        const ground = await getGroundById(booking.groundId);
        return {
          ...booking,
          ground: ground
            ? {
                name: ground.name,
                location: ground.location,
                city: ground.city,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ bookings: bookingsWithGrounds });
  } catch (error) {
    // console.error('Get Bookings Error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      groundId,
      customerName,
      customerPhone,
      date,
      startTime,
      endTime,
      reason,
    } = await request.json();

    if (
      !groundId ||
      !customerName ||
      !customerPhone ||
      !date ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Get ground details
    const ground = await getGroundById(groundId);

    if (!ground) {
      return NextResponse.json({ error: "Ground not found" }, { status: 404 });
    }

    // Enforce permanentCloseDate restriction
    if (ground.permanentCloseDate && date >= ground.permanentCloseDate) {
      return NextResponse.json(
        { error: "Bookings are not allowed after the permanent close date." },
        { status: 400 }
      );
    }

    // Check if slot is available (exclude cancelled bookings)
    const existingBookings = await getBookingsByGround(groundId);
    const activeBookings = existingBookings.filter(
      (booking) =>
        booking.status !== "CANCELLED" && booking.status !== "cancelled"
    );
    const existingBooking = activeBookings.find(
      (booking) =>
        booking.date === date &&
        booking.startTime === startTime &&
        booking.endTime === endTime
    );

    if (existingBooking) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 400 }
      );
    }

    // Calculate price based on time slot
    const price = isMorningSlot(startTime)
      ? ground.morningPrice
      : isEveningSlot(startTime)
      ? ground.eveningPrice
      : ground.nightPrice;

    // Create booking (immediately booked, no status)
    const bookingId = await createBooking({
      groundId,
      ownerId: ground.ownerId, // Save ground owner ID
      customerName,
      customerPhone,
      date,
      startTime,
      endTime,
      price,
      isCommissionPaid: false,
      reason: reason || null,
    });

    const booking = {
      id: bookingId,
      groundId,
      customerName,
      customerPhone,
      date,
      startTime,
      endTime,
      price,
      reason,
      ground: {
        name: ground.name,
        location: ground.location,
      },
    };

    // Update commission for ground owner
    try {
      await updateCommissionAmount(ground.ownerId, price, "add");
      // console.log(`Added commission for owner ${ground.ownerId}: ${price * commissionRate}`)
    } catch (commissionError) {}

    // Send SMS notifications to both customer and ground owner
    try {
      console.log(
        "Attempting to send SMS to ground owner phone:",
        ground.phone
      );
      // console.log("Full ground details:", JSON.stringify(ground, null, 2));
      // Send notification SMS to ground owner
      await sendBookingConfirmationToOwner(
        ground.phone, // Using ground phone as owner contact
        ground.name,
        date,
        startTime,
        endTime,
        customerName,
        customerPhone,
        price
      );
      // console.log("Successfully triggered SMS to owner.");
    } catch (smsError) {
      console.error("SMS notification error:", smsError);
      // Don't fail the booking if SMS fails
    }

    return NextResponse.json({ booking });
  } catch (error) {
    // console.error('Create Booking Error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
