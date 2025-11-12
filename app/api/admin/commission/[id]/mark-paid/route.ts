import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { markCommissionAsPaid } from "@/lib/firestore-server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Read body for amount, totalDue, and date
    const body = await request.json().catch(() => ({} as any));
    const amount = body?.amount ?? body?.paidAmount ?? null;
    const totalDue = body?.totalDue ?? null; // ADD THIS LINE
    const dateStr = body?.date ?? body?.paidDate ?? null;

    if (amount == null || isNaN(Number(amount))) {
      return NextResponse.json(
        { error: "Missing or invalid amount" },
        { status: 400 }
      );
    }

    // ADD THIS VALIDATION
    if (totalDue == null || isNaN(Number(totalDue))) {
      return NextResponse.json(
        { error: "Missing or invalid totalDue" },
        { status: 400 }
      );
    }

    const paidDate = dateStr ? new Date(dateStr) : new Date();

    // Mark commission as paid with amount, totalDue, and date
    await markCommissionAsPaid(
      params.id,
      Number(amount),
      Number(totalDue),
      paidDate
    ); // ADD totalDue HERE

    return NextResponse.json({
      success: true,
      message: "Commission marked as paid successfully",
      paidAt: new Date().toISOString(),
    });
  } catch (error) {
    // console.error('Mark Commission Paid Error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
