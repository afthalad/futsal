import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { getPaymentsByOwner } from "@/lib/firestore-server";

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

    const payments = await getPaymentsByOwner(user.id);

    return NextResponse.json({ payments });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
