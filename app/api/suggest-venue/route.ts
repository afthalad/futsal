import { NextRequest, NextResponse } from "next/server";
import adminApp, { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { venue } = await req.json();
    if (!venue || typeof venue !== "string" || venue.trim().length === 0) {
      return NextResponse.json(
        { error: "Venue name is required" },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin if not already
    // Firestore instance from adminDb
    await adminDb.collection("suggestions").add({
      venue: venue.trim(),
      createdAt: new Date().toISOString(),
      status: "inactive",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving suggestion:", error);
    return NextResponse.json(
      { error: "Failed to save suggestion" },
      { status: 500 }
    );
  }
}

// GET: Return all suggestions (for client display)
export async function GET(req: NextRequest) {
  try {
    const snapshot = await adminDb
      .collection("suggestions")
      .where("status", "==", "active")
      .get();
    const suggestions = snapshot.docs.map((doc) => ({
      id: doc.id,
      venue: doc.data().venue,
    }));
    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
