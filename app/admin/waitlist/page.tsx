"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "../../components/Logo";
import type { WaitlistEntry } from "../../../lib/waitlist-store";

export const dynamic = "force-dynamic";

export default function AdminWaitlistPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<WaitlistEntry[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/admin/waitlist", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        if (!cancelled) setError("Unable to load waitlist entries.");
        return;
      }
      const data = await res.json();
      if (!cancelled) setEntries(data.entries || []);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) =>
      [entry.name, entry.email, entry.church, entry.role]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [entries, query]);

  async function handleSignOut() {
    setSigningOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="min-h-screen">


      <main className="container-x py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold">Historical waitlist</h1>
            <p className="mt-1 text-sm text-slate-400">
              {entries === null
                ? "Loading..."
                : `${entries.length} total signup${entries.length === 1 ? "" : "s"}`}
            </p>
          </div>

          <div className="w-full sm:w-72">
            <label htmlFor="admin-search" className="sr-only">
              Search waitlist
            </label>
            <input
              id="admin-search"
              type="search"
              className="input"
              placeholder="Search name, email, church, role..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        {entries === null && !error && (
          <p className="mt-10 text-slate-400">Loading waitlist entries...</p>
        )}

        {entries !== null && filtered.length === 0 && (
          <p className="mt-10 text-slate-400">
            {entries.length === 0
              ? "No signups yet."
              : "No entries match your search."}
          </p>
        )}

        {filtered.length > 0 && (
          <>
            {/* Table view: sm and up */}
            <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-white/10 sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[.04] text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Church / Org</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Date Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[.03]">
                      <td className="px-5 py-4 font-medium text-white">
                        {entry.name}
                      </td>
                      <td className="px-5 py-4 text-slate-300">{entry.email}</td>
                      <td className="px-5 py-4 text-slate-300">
                        {entry.church || "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {entry.role || "—"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-400">
                        {formatDate(entry.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card view: below sm */}
            <div className="mt-8 grid gap-4 sm:hidden">
              {filtered.map((entry) => (
                <div
                  key={entry.id}
                  className="glass rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-white">{entry.name}</p>
                    <span className="whitespace-nowrap rounded-full bg-blue-400/10 px-2.5 py-1 text-xs text-blue-200">
                      {entry.role || "No role"}
                    </span>
                  </div>
                  <p className="mt-2 break-all text-sm text-slate-300">
                    {entry.email}
                  </p>
                  <div className="mt-3 space-y-1 text-sm text-slate-400">
                    <p>
                      <span className="text-slate-500">Church / Org: </span>
                      {entry.church || "—"}
                    </p>
                    <p>
                      <span className="text-slate-500">Joined: </span>
                      {formatDate(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
