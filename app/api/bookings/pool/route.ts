import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import {
  sendPoolAdvancePaymentRequest,
  sendPoolAdvancePaidConfirmation,
  sendPoolBookingConfirmed,
} from "@/lib/sms-service-pool";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Only ground owners can create manual bookings
    if (user.role !== "GROUND_OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      groundId,
      date,
      shift,
      customerName,
      customerPhone,
      numberOfPeople,
      totalPrice,
      isOccassion,
    } = await request.json();

    // Validate required fields
    if (
      !groundId ||
      !date ||
      !shift ||
      !customerName ||
      !customerPhone ||
      !numberOfPeople ||
      totalPrice === undefined ||
      totalPrice === null
    ) {
      console.log("Validation failed:", {
        groundId,
        date,
        shift,
        customerName,
        customerPhone,
        numberOfPeople,
        totalPrice,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify ground exists and belongs to user
    const groundDoc = await adminDb.collection("grounds").doc(groundId).get();

    if (!groundDoc.exists) {
      return NextResponse.json({ error: "Ground not found" }, { status: 404 });
    }

    const groundData = groundDoc.data();

    if (groundData?.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You don't own this ground" },
        { status: 403 },
      );
    }

    // Parse shift (format: "HH:MM-HH:MM")
    const [startTime, endTime] = shift.split("-");

    // Find shift data to get max capacity
    const shiftData = groundData?.shifts?.find(
      (s: any) => `${s.startTime}-${s.endTime}` === shift,
    );

    if (!shiftData) {
      return NextResponse.json(
        { error: "Invalid shift selected" },
        { status: 400 },
      );
    }

    // Check if shift is already booked
    const existingBookings = await adminDb
      .collection("bookings")
      .where("groundId", "==", groundId)
      .where("date", "==", date)
      .where("type", "==", "swimmingpool")
      .where("shift", "==", shift)
      .where("status", "!=", "CANCELLED")
      .get();

    if (!existingBookings.empty) {
      return NextResponse.json(
        { error: "This shift is already booked" },
        { status: 400 },
      );
    }

    // Create booking
    const bookingData = {
      groundId,
      ownerId: groundData.ownerId, // Add owner ID for commission tracking
      type: "swimmingpool",
      customerName,
      customerPhone,
      date,
      shift,
      isOccassion,
      startTime,
      endTime,
      numberOfPeople,
      price: totalPrice,
      status: "WAITING_ADVANCE",
      poolStatus: "WAITING_ADVANCE", // Add poolStatus field
      isCommissionPaid: false,
      createdAt: new Date().toISOString(),
      createdBy: user.id,

      isOwnerBooking: false,
    };

    const bookingRef = await adminDb.collection("bookings").add(bookingData);

    // Calculate advance amount
    const advancePercentage = groundData?.advancePercentage || 30;
    const advanceAmount = Math.round((totalPrice * advancePercentage) / 100);
    const balanceAmount = totalPrice - advanceAmount;

    // Send appropriate SMS based on status
    try {
      const status = bookingData.status;

      if (status === "WAITING_ADVANCE") {
        await sendPoolAdvancePaymentRequest(
          customerPhone,
          customerName,
          groundData.name,
          date,
          groundData?.phone || "N/A",
          startTime,
          endTime,
          numberOfPeople,
          totalPrice,
          advanceAmount,
          {
            accountName: groundData?.bankAccountName || "N/A",
            accountNumber: groundData?.bankAccountNumber || "N/A",
            bankName: groundData?.bankName || "N/A",
            branch: groundData?.bankBranch,
          },
        );
      } else if (status === "ADVANCE_PAID") {
        await sendPoolAdvancePaidConfirmation(
          customerPhone,
          customerName,
          groundData.name,
          date,
          startTime,
          endTime,
          numberOfPeople,
          balanceAmount,
          groundData?.customerRules,
          isOccassion || false,
          shiftData.maxCapacity,
        );
      } else if (status === "CONFIRMED") {
        await sendPoolBookingConfirmed(
          customerPhone,
          customerName,
          groundData.name,
          date,
          startTime,
          endTime,
          numberOfPeople,
          totalPrice,
          isOccassion || false,
          balanceAmount,
          groundData?.contactPhone || "N/A",
          shiftData.maxCapacity,
        );
      }
    } catch (smsError) {
      console.error("SMS sending error:", smsError);
      // Don't fail the booking if SMS fails
    }

    return NextResponse.json(
      {
        success: true,
        bookingId: bookingRef.id,
        message: "Swimming pool booking created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Swimming pool booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
