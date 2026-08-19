"use client";

import { useState } from "react";
import { AirisBadge } from "./Logo";

const ACCOUNT_NAME = "Airis IT Consult";
const BANK_NAME = "Moniepoint";
const ACCOUNT_NUMBER = "6736486863";

export default function Support() {
  const [copied, setCopied] = useState(false);
  const donationUrl = process.env.NEXT_PUBLIC_DONATION_URL;

  async function copyAccountNumber() {
    try {
      await navigator.clipboard.writeText(ACCOUNT_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the number is still visible to copy manually.
    }
  }

  return (
    <section id="support" className="container-x pb-20 sm:pb-24">
      <div className="glass rounded-3xl p-6 sm:p-8 md:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Support the project
            </p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              Help us build better tools for ministry.
            </h2>
            <p className="mt-3 text-slate-400">
              Support development, infrastructure, testing, and future
              VerseCue features.
            </p>

            <div className="mt-6">
              <AirisBadge height={20} />
              <p className="mt-2 text-sm text-slate-500">
                VerseCue is developed and powered by Airis IT Consult.
              </p>
            </div>

            {donationUrl && (
              <a
                href={donationUrl}
                className="btn-primary mt-6 inline-block"
                target="_blank"
                rel="noopener noreferrer"
              >
                Support VerseCue Online
              </a>
            )}
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Bank Transfer
            </p>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Account Name</dt>
                <dd className="mt-0.5 font-semibold text-white">
                  {ACCOUNT_NAME}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Bank</dt>
                <dd className="mt-0.5 font-semibold text-white">{BANK_NAME}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Account Number</dt>
                <dd className="mt-0.5 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-lg font-semibold text-white">
                    {ACCOUNT_NUMBER}
                  </span>
                  <button
                    type="button"
                    onClick={copyAccountNumber}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
