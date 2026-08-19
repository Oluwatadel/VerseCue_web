import { NextResponse } from "next/server";
import { readWaitlist } from "../../../../lib/waitlist-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await readWaitlist();
  // Most recent signups first.
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json({ entries: sorted });
}
