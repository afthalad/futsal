import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import {
  getAllGrounds,
  getCommissionByOwner,
  getPaymentsByOwner,
  getUnpaidCommissionsByOwner,
  getUserById,
} from "@/lib/firestore-server";
import { log } from "console";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (
      !user ||
      (user.role !== "SUPER_ADMIN" && user.role !== "GROUND_OWNER")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get grouped unpaid commission totals (calculated from bookings)
    const unpaidByOwner = await getUnpaidCommissionsByOwner();

    // Get grounds to compute ground counts and names
    const allGrounds = await getAllGrounds();

    // If the requester is a ground owner, return only their commission object
    if (user.role === "GROUND_OWNER") {
      const ownerId = user.id;
      const owner = await getUserById(ownerId);

      const ownerGrounds = allGrounds.filter((g) => g.ownerId === ownerId);

      const payableCommission = unpaidByOwner[ownerId]?.totalCommission || 0;
      const payments = await getPaymentsByOwner(ownerId);
      const lastPaymentRemaining =
        payments && payments.length > 0 ? payments[0].amountRemaining || 0 : 0;

      const commissionDoc = await getCommissionByOwner(ownerId);

      const totalDue =
        Math.round((payableCommission + lastPaymentRemaining) * 100) / 100;

      const commission = {
        id: ownerId,
        ownerId,
        ownerName: owner?.name || "Unknown",
        ownerPhone: owner?.phone || "N/A",
        groundCount: ownerGrounds.length,
        groundNames: ownerGrounds.map((g) => g.name).join(", "),
        // historical stored amount/balance
        amount: commissionDoc?.amount || 0,
        payableCommission,
        lastPaymentRemaining,
        totalDue,
        status: totalDue > 0 ? "PENDING" : "PAID",
        lastUpdated: commissionDoc?.lastUpdated || new Date(),
        paidAt: commissionDoc?.paidAt || null,
        bookings: unpaidByOwner[ownerId]?.bookings || [],
        payments: payments || [],
        bookingCount: unpaidByOwner[ownerId]?.bookings?.length || 0,
        balance: commissionDoc?.amount || 0,
        totalPaid:
          payments && payments.length > 0
            ? payments.reduce((s: number, p: any) => s + (p.amountPaid || 0), 0)
            : 0,
        lastPaymentDate:
          payments && payments.length > 0 ? payments[0].paidAt : null,
        calculatedUntil: unpaidByOwner[ownerId]?.bookings?.length
          ? unpaidByOwner[ownerId].bookings.slice(-1)[0].date
          : null,
      };

      return NextResponse.json({ commission });
    }

    // SUPER_ADMIN: build list for all owners with unpaid bookings
    const commissions = await Promise.all(
      Object.keys(unpaidByOwner).map(async (ownerId) => {
        try {
          const owner = await getUserById(ownerId);
          const ownerGrounds = allGrounds.filter((g) => g.ownerId === ownerId);

          // Get unpaid commission from bookings
          const payableCommission =
            unpaidByOwner[ownerId]?.totalCommission || 0;

          // Get last payment's remaining balance for THIS owner
          const payments = await getPaymentsByOwner(ownerId);
          let lastPaymentRemaining = 0;
          if (payments && payments.length > 0) {
            lastPaymentRemaining = payments[0].amountRemaining || 0;
          }

          // Total amount = unpaid bookings + last payment balance
          const totalAmount = payableCommission + lastPaymentRemaining;

          return {
            id: ownerId,
            ownerId,
            ownerName: owner?.name || "Unknown",
            ownerPhone: owner?.phone || "N/A",
            groundCount: ownerGrounds.length,
            groundNames: ownerGrounds.map((g) => g.name).join(", "),
            amount: totalAmount, // This is now: unpaid bookings + last payment balance
            payableCommission, // New unpaid bookings only
            lastPaymentRemaining, // Balance from last payment
            status: totalAmount > 0 ? "PENDING" : "PAID",
            lastUpdated: new Date(),
            paidAt: null,
            bookings: unpaidByOwner[ownerId]?.bookings || [],
          };
        } catch (error) {
          console.error(`Error processing owner ${ownerId}:`, error);
          return null;
        }
      })
    );

    const validCommissions = commissions
      .filter((c) => c !== null)
      .sort((a: any, b: any) => b.amount - a.amount);

    console.log("Valid Commissions:", validCommissions);
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
    console.error("Get Commissions Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
