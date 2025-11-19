import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

function normalizeRecipient(p: string) {
  if (!p) return p;
  let s = String(p).trim();
  if (s.startsWith("+")) s = s.slice(1);
  if (s.startsWith("0")) s = `94${s.replace(/^0/, "")}`;
  // ensure it starts with country code 94
  if (!s.startsWith("94")) s = `94${s}`;
  return s;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      groundId,
      customerName,
      customerPhone,
      date,
      startTime,
      endTime,
      price,
    } = body || {};

    if (!groundId || !customerName || !customerPhone || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const recipient = normalizeRecipient(customerPhone);

    const apiKey = process.env.SMS_API_KEY;
    const senderId = process.env.SMS_SENDER_ID;
    if (!apiKey) {
      console.error("SMS_API_KEY not set");
      return NextResponse.json(
        { error: "SMS provider not configured" },
        { status: 500 }
      );
    }

    const message = `Your booking verification code is: {{OTP5}}`;

    // Call Text.lk API
    const res = await fetch("https://app.text.lk/api/v3/sms/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        recipient,
        sender_id: senderId,
        type: "otp",
        message,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Text.lk error", data);
      return NextResponse.json(
        { error: "Failed to send OTP" },
        { status: 502 }
      );
    }

    // Store OTP entry in Firestore with expiry (5 minutes)
    const otpValue = data?.data?.otp ? String(data.data.otp) : null;
    const docRef = adminDb.collection("bookingOtps").doc();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
    await docRef.set({
      groundId,
      customerName,
      customerPhone: recipient,
      date,
      startTime,
      endTime,
      price,
      otp: otpValue,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      verified: false,
      attempts: 0,
    });

    return NextResponse.json({ success: true, otpId: docRef.id });
  } catch (err) {
    console.error("book-send-otp error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
