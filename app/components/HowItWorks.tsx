import { STEPS } from "../../lib/product";

export default function HowItWorks() {
  return (
    <section id="how" className="border-y border-white/10 bg-white/[.025]" aria-labelledby="how-title">
      <div className="container-x py-16 sm:py-20">
        <p className="eyebrow">The service workflow</p>
        <h2 id="how-title" className="mt-3 text-3xl font-bold sm:text-4xl">Listen with confidence. Display with intention.</h2>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <article key={step.number} className="rounded-2xl border border-white/10 bg-slate-950/50 p-6">
              <span className="text-sm font-semibold text-blue-300">{step.number}</span>
              <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
