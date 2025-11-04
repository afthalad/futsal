import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import {
  getAllGrounds,
  getUnpaidCommissionsByOwner,
  getUserById,
} from "@/lib/firestore-server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get grouped unpaid commission totals (calculated from bookings)
    const unpaidByOwner = await getUnpaidCommissionsByOwner();

    // Get grounds to compute ground counts and names
    const allGrounds = await getAllGrounds();

    const commissions = await Promise.all(
      Object.keys(unpaidByOwner).map(async (ownerId) => {
        try {
          const owner = await getUserById(ownerId);
          const ownerGrounds = allGrounds.filter((g) => g.ownerId === ownerId);
          const totalCommission = unpaidByOwner[ownerId]?.totalCommission || 0;

          return {
            id: ownerId,
            ownerId,
            ownerName: owner?.name || "Unknown",
            ownerPhone: owner?.phone || "N/A",
            groundCount: ownerGrounds.length,
            groundNames: ownerGrounds.map((g) => g.name).join(", "),
            amount: totalCommission,
            status: totalCommission > 0 ? "PENDING" : "PAID",
            lastUpdated: new Date(),
            paidAt: null,
            bookings: unpaidByOwner[ownerId]?.bookings || [],
          };
        } catch (error) {
          return null;
        }
      })
    );

    const validCommissions = commissions
      .filter((c) => c !== null)
      .sort((a: any, b: any) => b.amount - a.amount);

    return NextResponse.json({
      commissions: validCommissions,
      totalAmount: (validCommissions as any[]).reduce(
        (sum, c) => sum + (c?.amount || 0),
        0
      ),
      pendingCount: (validCommissions as any[]).filter(
        (c) => c?.status === "PENDING"
      ).length,
    });
  } catch (error) {
    // console.error('Get Commissions Error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
