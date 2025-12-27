import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    // console.error('Auth Error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
