import { NextResponse } from "next/server";
import { addWaitlistEntry } from "../../../lib/waitlist-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const church = String(body.church ?? "").trim();
    const role = String(body.role ?? "").trim();

    if (!name || !email) {
      return NextResponse.json(
        {
          error: "Name and email are required.",
        },
        { status: 400 }
      );
    }

    if (name.length > 150) {
      return NextResponse.json(
        {
          error: "Name is too long.",
        },
        { status: 400 }
      );
    }

    if (email.length > 320) {
      return NextResponse.json(
        {
          error: "Email address is too long.",
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    const entry = {
      id: crypto.randomUUID(),
      name,
      email,
      church,
      role,
      createdAt: new Date().toISOString(),
    };

    const inserted = await addWaitlistEntry(entry);

    if (!inserted) {
      return NextResponse.json(
        {
          message: "You're already on the VerseCue waitlist.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "You're on the VerseCue waitlist!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Waitlist submission error:", error);

    return NextResponse.json(
      {
        error: "Unable to join the waitlist. Please try again.",
      },
      { status: 500 }
    );
  }
}