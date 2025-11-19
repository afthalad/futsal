import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otpId, otp } = body || {};
    if (!otpId || !otp) {
      return NextResponse.json(
        { error: "otpId and otp required" },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("bookingOtps").doc(otpId);
    const snap = await docRef.get();
    if (!snap.exists)
      return NextResponse.json({ error: "OTP not found" }, { status: 404 });

    const entry = snap.data() as any;
    const now = new Date();
    if (entry.expiresAt && new Date(entry.expiresAt) < now) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    if (entry.attempts && entry.attempts >= 5) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    if (String(entry.otp) !== String(otp)) {
      await docRef.update({ attempts: (entry.attempts || 0) + 1 });
      return NextResponse.json({ error: "OTP incorrect" }, { status: 400 });
    }

    // mark verified
    await docRef.update({
      verified: true,
      verifiedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("booking-verify-otp error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
