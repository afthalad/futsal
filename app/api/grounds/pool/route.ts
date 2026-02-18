import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getUserFromToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (!user || user.role !== "GROUND_OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();

    if (!data.name || !data.location || !data.city || !data.phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!data.shifts || data.shifts.length === 0) {
      return NextResponse.json(
        { error: "At least one shift is required" },
        { status: 400 },
      );
    }

    const poolData = {
      name: data.name,
      description: data.description || "",
      location: data.location,
      city: data.city,
      phone: data.phone,
      secondaryPhone: data.secondaryPhone || "",
      images: data.images || [],
      isListing: data.isListing !== false,
      shifts: data.shifts || [],
      customerRules: data.customerRules || "",
      advancePercentage: data.advancePercentage || "",
      bankAccountName: data.bankAccountName || "",
      bankAccountNumber: data.bankAccountNumber || "",
      bankName: data.bankName || "",
      bankBranch: data.bankBranch || "",
      type: "swimmingpool",
      ownerId: user.id,
      isActive: true,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("grounds").add(poolData);

    return NextResponse.json({
      ground: {
        id: docRef.id,
        ...poolData,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create swimming pool: " + String(error) },
      { status: 500 },
    );
  }
}
