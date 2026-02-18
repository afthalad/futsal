import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import {
  sendPoolAdvancePaymentRequest,
  sendPoolAdvancePaidConfirmation,
  sendPoolBookingConfirmed,
} from "@/lib/sms-service-pool";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Only ground owners can update booking status
    if (user.role !== "GROUND_OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    const bookingId = params.id;

    // Get booking
    const bookingDoc = await adminDb
      .collection("bookings")
      .doc(bookingId)
      .get();

    if (!bookingDoc.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const bookingData = bookingDoc.data();

    // Verify booking is a swimming pool booking
    if (bookingData?.type !== "swimmingpool") {
      return NextResponse.json(
        { error: "This endpoint is only for swimming pool bookings" },
        { status: 400 },
      );
    }

    // Verify ground belongs to user
    const groundDoc = await adminDb
      .collection("grounds")
      .doc(bookingData.groundId)
      .get();

    if (!groundDoc.exists || groundDoc.data()?.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You don't own this ground" },
        { status: 403 },
      );
    }

    // Update booking status
    await adminDb.collection("bookings").doc(bookingId).update({
      poolStatus: status,
      updatedAt: new Date().toISOString(),
    });

    // Get ground data for SMS
    const ground = groundDoc.data();

    // Find shift data to get max capacity
    const shiftData = ground?.shifts?.find(
      (s: any) => `${s.startTime}-${s.endTime}` === bookingData?.shift,
    );

    // Calculate advance amount
    const totalPrice = bookingData?.price || 0;
    const advancePercentage = ground?.advancePercentage || 0;
    const advanceAmount = Math.round((totalPrice * advancePercentage) / 100);
    const balanceAmount = totalPrice - advanceAmount;

    // Send appropriate SMS based on status
    try {
      if (status === "WAITING_ADVANCE") {
        await sendPoolAdvancePaymentRequest(
          bookingData?.customerPhone,
          bookingData?.customerName,
          ground?.name,
          bookingData?.date,
          ground?.phone,
          bookingData?.startTime,
          bookingData?.endTime,
          bookingData?.numberOfPeople || 1,
          totalPrice,
          advanceAmount,
          {
            accountName: ground?.bankAccountName || "N/A",
            accountNumber: ground?.bankAccountNumber || "N/A",
            bankName: ground?.bankName || "N/A",
            branch: ground?.bankBranch,
          },
        );
      } else if (status === "ADVANCE_PAID") {
        await sendPoolAdvancePaidConfirmation(
          bookingData?.customerPhone,
          bookingData?.customerName,
          ground?.name,
          bookingData?.date,

          bookingData?.startTime,
          bookingData?.endTime,
          bookingData?.numberOfPeople || 1,
          balanceAmount,
          ground?.customerRules,
          bookingData?.isOccassion || false,
          shiftData?.maxCapacity,
        );
      } else if (status === "CONFIRMED") {
        await sendPoolBookingConfirmed(
          bookingData?.customerPhone,
          bookingData?.customerName,
          ground?.name,
          bookingData?.date,
          bookingData?.startTime,
          bookingData?.endTime,
          bookingData?.numberOfPeople || 1,
          totalPrice,
          bookingData?.isOccassion || false,
          balanceAmount,
          ground?.phone,
          shiftData?.maxCapacity,
        );
      }
    } catch (smsError) {
      console.error("SMS sending error:", smsError);
      // Don't fail the entire request if SMS fails
    }

    return NextResponse.json({
      success: true,
      message: "Status updated and SMS sent successfully",
      status,
    });
  } catch (error) {
    console.error("Update pool status error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 },
    );
  }
}
