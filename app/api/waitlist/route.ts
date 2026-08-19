import { NextResponse } from "next/server";
import { readWaitlist, writeWaitlist, type WaitlistEntry } from "../../../lib/waitlist-store";

export async function POST(request: Request) {
  try {
    const b = await request.json();
    const name = String(b.name ?? "").trim();
    const email = String(b.email ?? "").trim().toLowerCase();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    const entries = await readWaitlist();

    if (entries.some((x) => x.email === email)) {
      return NextResponse.json({
        message: "You're already on the VerseCue waitlist.",
      });
    }

    const entry: WaitlistEntry = {
      id: crypto.randomUUID(),
      name,
      email,
      church: String(b.church ?? "").trim(),
      role: String(b.role ?? "").trim(),
      createdAt: new Date().toISOString(),
    };

    entries.push(entry);
    await writeWaitlist(entries);

    return NextResponse.json({ message: "You're on the VerseCue waitlist!" });
  } catch {
    return NextResponse.json(
      { error: "Unable to join the waitlist." },
      { status: 500 }
    );
  }
}
