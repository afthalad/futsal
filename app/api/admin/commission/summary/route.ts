import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { getTotalUnpaidCommissionFromBookings } from "@/lib/firestore-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Compute total unpaid commission across all bookings (no per-owner grouping)
    const { totalCommission, bookingsCount } =
      await getTotalUnpaidCommissionFromBookings();

    // Also include outstanding balances from payments (amountRemaining > 0)
    // This covers the case where bookings were marked paid but a partial payment left a remaining balance.
    let paymentsOutstanding = 0;
    try {
      const paymentsSnap = await (await import("@/lib/firebase-admin")).adminDb
        .collection("payments")
        .where("amountRemaining", ">", 0)
        .get();
      paymentsOutstanding = paymentsSnap.docs.reduce((s: number, d: any) => {
        const v = Number(d.data()?.amountRemaining || 0);
        return s + v;
      }, 0);
      paymentsOutstanding = Math.round(paymentsOutstanding * 100) / 100;
    } catch (err) {
      // If payments query fails, ignore and fall back to bookings-only total
      console.error("Error fetching payments outstanding:", err);
      paymentsOutstanding = 0;
    }

    const combinedTotal =
      Math.round((totalCommission + paymentsOutstanding) * 100) / 100;

    return NextResponse.json({
      unpaidBookingsCommission: Number(totalCommission.toFixed(2)),
      unpaidBookingsCount: bookingsCount,
      paymentsOutstanding: Number(paymentsOutstanding.toFixed(2)),
      totalUnpaidCommission: combinedTotal,
    });
  } catch (error) {
    console.error("Commission summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
