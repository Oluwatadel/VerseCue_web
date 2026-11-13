import Link from "next/link";
import { AirisBadge, Logo } from "./Logo";

export default function Footer() {
  return <footer className="border-t border-slate-200">
    <div className="container-x grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
      <div><Link href="/" className="inline-flex" aria-label="verseVIO home"><Logo iconSize={30} /></Link><p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">Scripture lookup, sermon preparation and presentation controls for preachers and church media teams.</p></div>
      <div><p className="font-semibold">verseVIO</p><ul className="mt-4 space-y-3 text-sm text-slate-600"><li><Link href="/features">Features</Link></li><li><Link href="/download">Downloads</Link></li><li><Link href="/pricing">Pricing & plans</Link></li><li><Link href="/account">Account dashboard</Link></li><li><Link href="/releases">Release notes</Link></li><li><Link href="/about">About the app</Link></li></ul></div>
      <div><p className="font-semibold">Help for your team</p><ul className="mt-4 space-y-3 text-sm text-slate-600"><li><Link href="/docs/getting-started">Getting started</Link></li><li><Link href="/docs">User guides</Link></li><li><Link href="/support">Support centre</Link></li><li><Link href="/support#report">Report a problem</Link></li></ul></div>
    </div>
    <div className="container-x flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 py-6 text-xs text-slate-500"><p>© {new Date().getFullYear()} verseVIO · The Word, Made Visible.</p><AirisBadge height={20} /></div>
  </footer>;
}
