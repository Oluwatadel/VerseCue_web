import { NextResponse } from "next/server";
import { readWaitlist } from "../../../../lib/waitlist-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const entries = await readWaitlist();

    return NextResponse.json({
      entries,
    });
  } catch (error) {
    console.error("Unable to load waitlist:", error);

    return NextResponse.json(
      {
        error: "Unable to load waitlist entries.",
      },
      { status: 500 }
    );
  }
}