import Link from "next/link";

export default function MobileRemote() {
  return <section className="container-x pb-16 sm:pb-20" aria-labelledby="remote-title">
    <div className="glass grid gap-8 rounded-xl p-6 sm:p-9 md:grid-cols-[1.5fr_1fr]">
      <div><p className="eyebrow">verseVIO Remote</p><h2 id="remote-title" className="mt-3 text-3xl font-bold">Your service workspace, within reach.</h2>
      <p className="mt-4 leading-7 text-slate-600">Use your phone in landscape to browse Scripture, prepare songs and slides, manage queues and control the desktop display. Pair from Preferences → Mobile remote on the same private network.</p>
      <Link href="/remote" className="btn-primary mt-6 inline-flex">Explore Remote & download →</Link></div>
      <div className="rounded-xl border border-blue-300/30 bg-blue-400/10 p-6"><h3 className="font-semibold">Free presentation control</h3><p className="mt-3 text-sm leading-7 text-slate-600">Available to free and paid accounts. AI transcription, detection, notes generation and phone microphone input require paid or administrator-granted AI access on the desktop.</p><p className="mt-3 text-sm text-slate-500">Android APK when published · iPhone coming soon</p></div>
    </div>
  </section>;
}
