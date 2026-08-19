"use client";

import { FormEvent, useState } from "react";

export default function Waitlist() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function join(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    const r = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    setStatus(d.message || d.error || "Something went wrong.");
    setLoading(false);
    if (r.ok) e.currentTarget.reset();
  }

  return (
    <section id="waitlist" className="container-x py-20 sm:py-24">
      <div className="mx-auto max-w-3xl rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-600/15 to-violet-600/15 p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
          Early access
        </p>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
          Join the VerseCue waitlist
        </h2>
        <p className="mt-3 text-slate-300">
          Be among the first churches and media teams to try VerseCue.
        </p>

        <form onSubmit={join} className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wl-name" className="sr-only">
              Your name
            </label>
            <input
              id="wl-name"
              className="input"
              name="name"
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label htmlFor="wl-email" className="sr-only">
              Email address
            </label>
            <input
              id="wl-email"
              className="input"
              name="email"
              type="email"
              placeholder="Email address"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="wl-church" className="sr-only">
              Church / organization
            </label>
            <input
              id="wl-church"
              className="input"
              name="church"
              placeholder="Church / organization"
              autoComplete="organization"
            />
          </div>
          <div>
            <label htmlFor="wl-role" className="sr-only">
              Your role
            </label>
            <select id="wl-role" className="input" name="role" defaultValue="">
              <option value="" disabled>
                Select your role
              </option>
              <option>Media Operator</option>
              <option>Pastor</option>
              <option>Church Administrator</option>
              <option>Media Team</option>
              <option>Other</option>
            </select>
          </div>
          <button disabled={loading} className="btn-primary sm:col-span-2">
            {loading ? "Joining..." : "Join the Waitlist"}
          </button>
        </form>

        {status && (
          <p role="status" className="mt-5 rounded-xl bg-white/5 p-4 text-sm">
            {status}
          </p>
        )}
      </div>
    </section>
  );
}
