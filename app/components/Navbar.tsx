"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/download", label: "Download" },
  { href: "/docs", label: "Guides" },
  { href: "/support", label: "Support" },
  { href: "/about", label: "About" },
  { href: "/account", label: "Account" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030b1c]/80 backdrop-blur-xl">
      <nav className="container-x flex items-center justify-between py-4">
        <a
          href="/"
          className="flex items-center"
          aria-label="VerseCue home"
          onClick={() => setOpen(false)}
        >
          <Logo iconSize={34} />
        </a>

        <div className="hidden items-center gap-7 text-sm text-slate-300 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={pathname === link.href ? "text-blue-200" : "transition hover:text-white"}
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white lg:hidden"
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
        <div id="mobile-menu" className="border-t border-white/5 lg:hidden">
          <div className="container-x flex flex-col gap-1 py-4 text-slate-300">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base transition hover:bg-white/5 hover:text-white"
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
