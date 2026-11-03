"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "../../components/Logo";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Unable to sign in.");
      setLoading(false);
      return;
    }

    const requested = searchParams.get("next") || "/admin/licenses";
    const next = requested.startsWith("/admin/") && !requested.includes("\\") ? requested : "/admin/licenses";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="glass w-full max-w-sm rounded-3xl p-8">
        <div className="flex justify-center">
          <Logo iconSize={40} />
        </div>
        <h1 className="mt-6 text-center text-xl font-bold">Admin Sign In</h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Account and licence administration
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="admin-password" className="sr-only">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="input"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-500/10 p-3 text-center text-sm text-red-300"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
