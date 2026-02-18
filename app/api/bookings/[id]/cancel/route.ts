import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

import { getUserFromToken } from "@/lib/auth";
import {
  getBookingById,
  updateBooking,
  getGroundById,
  updateCommissionAmount,
} from "@/lib/firestore-server";
import {
  getBookingByIdInMemory,
  updateBookingInMemory,
  getGroundByIdInMemory,
} from "@/lib/memory-storage";
import { sendBookingCancellationToCustomer } from "@/lib/sms-service";
import { sendPoolBookingCancellation } from "@/lib/sms-service-pool";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (
      !user ||
      (user.role !== "GROUND_OWNER" && user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { reason } = await request.json();

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "Cancellation reason is required" },
        { status: 400 },
      );
    }

    // Get booking details
    let booking;
    try {
      booking = await getBookingById(params.id);
    } catch (error) {
      booking = getBookingByIdInMemory(params.id);
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Get ground details
    let ground;
    try {
      ground = await getGroundById(booking.groundId);
    } catch (error) {
      ground = getGroundByIdInMemory(booking.groundId);
    }

    if (!ground) {
      return NextResponse.json({ error: "Ground not found" }, { status: 404 });
    }

    // Check if user is the ground owner or super admin
    if (user.role === "GROUND_OWNER" && ground.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You can only cancel bookings for your own grounds" },
        { status: 403 },
      );
    }

    // Update booking status to cancelled
    const updatedBooking = {
      ...booking,
      status: "CANCELLED",
      cancellationReason: reason,
      cancelledAt: new Date(),
      cancelledBy: user.id,
    };

    try {
      await updateBooking(params.id, updatedBooking);
    } catch (error) {
      // console.error('Error updating booking in Firestore, using memory storage:', error)
      updateBookingInMemory(params.id, updatedBooking);
    }

    // Update commission for ground owner (subtract the cancelled booking's commission)
    try {
      await updateCommissionAmount(ground.ownerId, booking.price, "subtract");
    } catch (commissionError) {}

    // Send SMS notification to customer
    try {
      // Send cancellation SMS based on booking type
      if (booking.type === "swimmingpool") {
        await sendPoolBookingCancellation(
          booking.customerPhone,
          booking.customerName,
          ground.name,
          booking.date,
          booking.startTime,
          booking.endTime,
          reason,
        );
      }
    } catch (error) {
      console.error("Error sending cancellation SMS:", error);
      // Don't fail the request if SMS fails
    }

    return NextResponse.json({
      message: "Booking cancelled successfully.",
      booking: updatedBooking,
    });
  } catch (error) {
    // console.error('Cancel Booking Error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
