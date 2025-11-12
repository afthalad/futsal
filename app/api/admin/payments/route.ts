import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { getUserById } from "@/lib/firestore-server";
import { adminDb } from "@/lib/firebase-admin";

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

    const url = new URL(request.url);
    const ownerId = url.searchParams.get("ownerId");
    const from = url.searchParams.get("from"); // YYYY-MM-DD
    const to = url.searchParams.get("to");

    // Fetch payments (we'll read all then filter in-memory for date range if provided)
    let q = adminDb.collection("payments").orderBy("createdAt", "desc");
    if (ownerId) q = q.where("ownerId", "==", ownerId);

    const snapshot = await q.get();
    const payments = snapshot.docs.map((doc) => {
      const data: any = doc.data();

      // Normalize date/timestamp fields to ISO strings for the client
      const paidAt = data.paidAt
        ? data.paidAt.toDate
          ? data.paidAt.toDate().toISOString()
          : new Date(data.paidAt).toISOString()
        : null;

      const createdAt = data.createdAt
        ? data.createdAt.toDate
          ? data.createdAt.toDate().toISOString()
          : new Date(data.createdAt).toISOString()
        : null;

      let cutoffDate: string | null = null;
      if (data.cutoffDate) {
        if (typeof data.cutoffDate === "string") cutoffDate = data.cutoffDate;
        else if (data.cutoffDate.toDate)
          cutoffDate = data.cutoffDate.toDate().toISOString().split("T")[0];
        else cutoffDate = new Date(data.cutoffDate).toISOString().split("T")[0];
      }

      return {
        id: doc.id,
        ...data,
        paidAt,
        createdAt,
        cutoffDate,
      };
    });

    // Filter by cutoffDate/paidAt range if provided
    const filtered = payments.filter((p: any) => {
      if (from) {
        const cutoff =
          p.cutoffDate ||
          (p.paidAt ? new Date(p.paidAt).toISOString().split("T")[0] : null);
        if (!cutoff || cutoff < from) return false;
      }
      if (to) {
        const cutoff =
          p.cutoffDate ||
          (p.paidAt ? new Date(p.paidAt).toISOString().split("T")[0] : null);
        if (!cutoff || cutoff > to) return false;
      }
      return true;
    });

    // Enrich payments with owner name/phone
    const ownerIds = Array.from(new Set(filtered.map((p: any) => p.ownerId)));
    const ownerMap: Record<string, any> = {};
    await Promise.all(
      ownerIds.map(async (id) => {
        const u = await getUserById(id).catch(() => null);
        if (u) ownerMap[id] = { name: u.name, phone: u.phone };
      })
    );

    const result = filtered.map((p: any) => ({
      ...p,
      ownerName: ownerMap[p.ownerId]?.name || null,
      ownerPhone: ownerMap[p.ownerId]?.phone || null,
      amountPaid: Number(p.amountPaid || 0),
      amountRemaining: Number(p.amountRemaining || 0),
      totalDue: Number(p.totalDue || 0),
      bookingsPaidCount: Number(p.bookingsPaidCount || 0),
    }));

    return NextResponse.json({ payments: result });
  } catch (error) {
    console.error("Payments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
