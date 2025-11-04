import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { getUnpaidCommissionsByOwner } from "@/lib/firestore-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (!user || user.role !== "GROUND_OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get unpaid commission calculations
    const unpaidCommissions = await getUnpaidCommissionsByOwner();
    const ownerUnpaidCommission = unpaidCommissions[user.id];

    // Create commission data structure
    const commission = {
      payableCommission: ownerUnpaidCommission
        ? ownerUnpaidCommission.totalCommission
        : 0,
      bookingCount: ownerUnpaidCommission
        ? ownerUnpaidCommission.bookings.length
        : 0,
      calculatedUntil: new Date().toISOString().split("T")[0], // Today's date
      commissionType:
        user.id === "eq9ywFOCOlqEkUBUaDeh" ? "PERCENTAGE" : "FLAT",
      commissionRate: user.id === "eq9ywFOCOlqEkUBUaDeh" ? 0.01 : 50,
      status: ownerUnpaidCommission?.totalCommission > 0 ? "PENDING" : "PAID",
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      commission: commission || {
        amount: 0,
        payableCommission: 0,
        status: "PAID",
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    // console.error('Get Commission Error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
