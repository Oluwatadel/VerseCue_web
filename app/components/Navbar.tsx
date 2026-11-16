"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/download", label: "Download" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Guides" },
  { href: "/support", label: "Support" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let pending: AbortController | null = null;
    let busy = false;
    let lastCheck = 0;
    async function refreshSession() {
      if (busy || document.visibilityState === "hidden" || Date.now() - lastCheck < 30000) return;
      busy = true; lastCheck = Date.now();
      const controller = new AbortController();
      pending = controller;
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch("/api/account", {cache: "no-store", signal: controller.signal});
        if (!cancelled && !controller.signal.aborted) {
          if (response.ok) setSignedIn(true);
          else if (response.status === 401 || response.status === 403) setSignedIn(false);
        }
      } catch { /* Keep navigation usable when the account service is offline. */ }
      finally {clearTimeout(timeout);busy = false;}
    }
    void refreshSession();
    window.addEventListener("focus", refreshSession);
    return () => {cancelled = true;pending?.abort();window.removeEventListener("focus", refreshSession);};
  }, [pathname]);
  const links = [...NAV_LINKS, signedIn
    ? {href: "/account", label: "Dashboard"}
    : {href: "/account/login", label: "Login"}];

  return (
    <header className="site-header sticky top-0 z-50 border-b border-slate-200 bg-white">
      <nav className="container-x flex items-center justify-between py-4">
        <a
          href="/"
          className="flex items-center"
          aria-label="verseVIO home"
          onClick={() => setOpen(false)}
        >
          <Logo iconSize={34} />
        </a>

        <div className="hidden items-center gap-5 text-sm text-slate-600 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={pathname === link.href ? "text-blue-700" : "transition hover:text-blue-700"}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a href="/download" className="btn-primary hidden text-sm sm:inline-flex">
            Download for Windows
          </a>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-900 lg:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            {open ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-slate-200 lg:hidden">
          <div className="container-x flex flex-col gap-1 py-4 text-slate-600">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base transition hover:bg-slate-50 hover:text-blue-700"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/download"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 justify-center text-center sm:hidden"
            >
              Download for Windows
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
