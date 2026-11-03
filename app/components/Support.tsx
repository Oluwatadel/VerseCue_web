import Link from "next/link";

export default function Support() {
  return <section className="container-x py-16 sm:py-20" aria-labelledby="help-title">
    <div className="glass grid gap-7 rounded-3xl p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
      <div><p className="eyebrow">Ready for the booth</p><h2 id="help-title" className="mt-3 text-3xl font-bold">A clear path from setup to Sunday.</h2>
        <p className="mt-4 max-w-2xl leading-7 text-slate-300">Find installation guidance, microphone checks, projection help and tips for your team. The support centre brings VerseCue help together in one place.</p></div>
      <div className="flex flex-wrap gap-3"><Link href="/docs/getting-started" className="btn-primary">Getting started</Link><Link href="/support" className="btn-secondary">Visit support</Link></div>
    </div>
  </section>;
}
