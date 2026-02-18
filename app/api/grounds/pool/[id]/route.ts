import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getUserFromToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (
      !user ||
      (user.role !== "GROUND_OWNER" && user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const poolDoc = await adminDb.collection("grounds").doc(params.id).get();

    if (!poolDoc.exists) {
      return NextResponse.json(
        { error: "Swimming pool not found" },
        { status: 404 },
      );
    }

    const poolData = poolDoc.data();

    // Check if this is actually a swimming pool
    if (poolData?.type !== "swimmingpool") {
      return NextResponse.json(
        { error: "Ground is not a swimming pool" },
        { status: 400 },
      );
    }

    // For ground owners, only allow access to their own pools
    if (user.role === "GROUND_OWNER" && poolData?.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ground: {
        id: poolDoc.id,
        ...poolData,
      },
    });
  } catch (error) {
    console.error("Error fetching swimming pool:", error);
    return NextResponse.json(
      { error: "Failed to fetch swimming pool" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (
      !user ||
      (user.role !== "GROUND_OWNER" && user.role !== "SUPER_ADMIN")
    ) {
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

    // Check if the pool exists and user has permission
    const poolDoc = await adminDb.collection("grounds").doc(params.id).get();

    if (!poolDoc.exists) {
      return NextResponse.json(
        { error: "Swimming pool not found" },
        { status: 404 },
      );
    }

    const existingData = poolDoc.data();

    // Check if this is actually a swimming pool
    if (existingData?.type !== "swimmingpool") {
      return NextResponse.json(
        { error: "Ground is not a swimming pool" },
        { status: 400 },
      );
    }

    // For ground owners, only allow access to their own pools
    if (user.role === "GROUND_OWNER" && existingData?.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedPoolData = {
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
      updatedAt: new Date(),
      // Preserve original fields
      type: existingData.type,
      ownerId: existingData.ownerId,
      createdAt: existingData.createdAt,
      isActive: existingData.isActive,
      status: existingData.status,
    };

    await adminDb.collection("grounds").doc(params.id).update(updatedPoolData);

    return NextResponse.json({
      ground: {
        id: params.id,
        ...updatedPoolData,
      },
    });
  } catch (error) {
    console.error("Error updating swimming pool:", error);
    return NextResponse.json(
      { error: "Failed to update swimming pool: " + String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (
      !user ||
      (user.role !== "GROUND_OWNER" && user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if the pool exists and user has permission
    const poolDoc = await adminDb.collection("grounds").doc(params.id).get();

    if (!poolDoc.exists) {
      return NextResponse.json(
        { error: "Swimming pool not found" },
        { status: 404 },
      );
    }

    const existingData = poolDoc.data();

    // Check if this is actually a swimming pool
    if (existingData?.type !== "swimmingpool") {
      return NextResponse.json(
        { error: "Ground is not a swimming pool" },
        { status: 400 },
      );
    }

    // For ground owners, only allow access to their own pools
    if (user.role === "GROUND_OWNER" && existingData?.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await adminDb.collection("grounds").doc(params.id).delete();

    return NextResponse.json({ message: "Swimming pool deleted successfully" });
  } catch (error) {
    console.error("Error deleting swimming pool:", error);
    return NextResponse.json(
      { error: "Failed to delete swimming pool" },
      { status: 500 },
    );
  }
}
