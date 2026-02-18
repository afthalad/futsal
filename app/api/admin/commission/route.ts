import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import {
  getAllGrounds,
  getCommissionByOwner,
  getPaymentsByOwner,
  getAllUnpaidCommissionsByOwner,
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

    // Get grounds to compute ground counts and names
    const allGrounds = await getAllGrounds();

    // Get grouped unpaid commission totals (calculated from bookings - both futsal and swimming pool)
    const unpaidByOwner = await getAllUnpaidCommissionsByOwner();

    // Build a union of ownerIds to include:
    // - owners with unpaid bookings (unpaidByOwner keys)
    // - owners with a commission doc amount > 0
    // - owners with payments that have amountRemaining > 0
    const ownerIdSet = new Set<string>(Object.keys(unpaidByOwner));

    // Include owners with commission documents that have outstanding amount
    try {
      const commissionSnapshot = await adminDb
        .collection("commission")
        .where("amount", ">", 0)
        .get();
      commissionSnapshot.docs.forEach((doc) => ownerIdSet.add(doc.id));
    } catch (err) {
      // ignore - if commission collection query fails, continue with existing owners
    }

    // Include owners with payments that have remaining balances
    try {
      const paymentsSnapshot = await adminDb
        .collection("payments")
        .where("amountRemaining", ">", 0)
        .get();
      paymentsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data && data.ownerId) ownerIdSet.add(data.ownerId as string);
      });
    } catch (err) {
      // ignore - not critical
    }

    const ownerIds = Array.from(ownerIdSet);

    const commissions = await Promise.all(
      ownerIds.map(async (ownerId) => {
        try {
          const owner = await getUserById(ownerId);
          const ownerGrounds = allGrounds.filter((g) => g.ownerId === ownerId);

          // Commission calculated from unpaid bookings (may be 0)
          const totalCommission = unpaidByOwner[ownerId]?.totalCommission || 0;

          // Get owner's payments
          const ownerPayments = await getPaymentsByOwner(ownerId);

          // Take latest payment (payments ordered desc)
          const lastPayment =
            ownerPayments && ownerPayments.length > 0 ? ownerPayments[0] : null;

          const lastPaymentRemaining = lastPayment?.amountRemaining || 0;

          const totalDue =
            Math.round((totalCommission + lastPaymentRemaining) * 100) / 100;

          return {
            id: ownerId,
            ownerId,
            ownerName: owner?.name || "Unknown",
            ownerPhone: owner?.phone || "N/A",
            groundCount: ownerGrounds.length,
            groundNames: ownerGrounds.map((g) => g.name).join(", "),
            payableCommission: totalCommission,
            lastPaymentRemaining,
            totalDue,
            payments: ownerPayments || [],
            status: totalDue > 0 ? "PENDING" : "PAID",
            lastUpdated: new Date(),
            lastPaymentDate:
              ownerPayments && ownerPayments.length > 0
                ? ownerPayments[0].paidAt
                : null,
            bookings: unpaidByOwner[ownerId]?.bookings || [],
            futsalBookingCount: unpaidByOwner[ownerId]?.futsalCount || 0,
            poolBookingCount: unpaidByOwner[ownerId]?.poolCount || 0,
          };
        } catch (error) {
          return null;
        }
      }),
    );

    const validCommissions = commissions
      .filter((c) => c !== null)
      .sort((a: any, b: any) => (b.totalDue || 0) - (a.totalDue || 0));

    return NextResponse.json({
      commissions: validCommissions,
      totalAmount: (validCommissions as any[]).reduce(
        (sum, c) => sum + (c?.totalDue || 0),
        0,
      ),
      pendingCount: (validCommissions as any[]).filter(
        (c) => c?.status === "PENDING",
      ).length,
    });
  } catch (error) {
    // console.error('Get Commissions Error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
