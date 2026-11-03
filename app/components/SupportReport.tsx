"use client";
import { FormEvent, useState } from "react";
export default function SupportReport({ email }: { email: string | null }) {
  const [report, setReport] = useState(""); const [message, setMessage] = useState("");
  function prepare(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); setReport(["VerseCue support report", `App version: ${data.get("version") || "Not provided"}`, `Windows version: ${data.get("windows") || "Not provided"}`, `Speech model: ${data.get("model")}`, `Bible translation: ${data.get("translation") || "Not provided"}`, "", "What happened:", String(data.get("problem")), "", "Steps to reproduce:", String(data.get("steps") || "Not provided")].join("\n")); setMessage(""); }
  async function copy() { try { await navigator.clipboard.writeText(report); setMessage("Report copied. You can paste it into your support message."); } catch { setMessage("Copy is unavailable in this browser. Select the report text below and copy it manually."); } }
  return <section id="report" className="glass rounded-3xl p-6 sm:p-8"><h2 className="text-2xl font-bold">Prepare a support report</h2><p className="mt-3 leading-7 text-slate-300">Collect the details needed to investigate an issue. This creates a report on your device; it does not submit a ticket or upload recordings.</p><form onSubmit={prepare} className="mt-6 grid gap-4 sm:grid-cols-2">
    <label className="field-label">App version<input className="input mt-2" name="version" placeholder="Version shown by your build" maxLength={100} /></label>
    <label className="field-label">Windows version<input className="input mt-2" name="windows" placeholder="Your Windows version" maxLength={100} /></label>
    <label className="field-label">Speech model<select className="input mt-2" name="model"><option>Parakeet (bundled)</option><option>Whisper Small English</option><option>Whisper Medium English</option><option>Whisper Large v3 Turbo</option><option>Not sure</option></select></label>
    <label className="field-label">Bible translation<input className="input mt-2" name="translation" placeholder="For example, KJV" maxLength={80} /></label>
    <label className="field-label sm:col-span-2">What happened?<textarea className="input mt-2 min-h-28" name="problem" required maxLength={5000} placeholder="Describe the problem and any error message." /></label>
    <label className="field-label sm:col-span-2">Steps to reproduce<textarea className="input mt-2 min-h-24" name="steps" maxLength={5000} placeholder="What did you click or change before the issue occurred?" /></label>
    <button className="btn-primary justify-self-start sm:col-span-2">Create report</button>
  </form>{report && <div className="mt-6"><label htmlFor="prepared-report" className="field-label">Your prepared report</label><textarea id="prepared-report" value={report} readOnly className="input mt-2 min-h-64 font-mono text-sm" /><button type="button" className="btn-secondary mt-3" onClick={copy}>Copy report</button>{message && <p role="status" className="mt-3 text-sm text-blue-200">{message}</p>}</div>}
  <p className="mt-5 text-sm leading-6 text-slate-400">{email ? <>Send your prepared report to <a className="text-blue-200 underline" href={`mailto:${email}`}>{email}</a>.</> : "The support contact channel has not been published yet. You can prepare and keep your report now; contact details will appear here when configured."}</p>
  </section>;
}
