import { FEATURES } from "../../lib/product";

export default function Features({ compact = false }: { compact?: boolean }) {
  return (
    <section id="features" className="container-x py-16 sm:py-20" aria-labelledby="features-title">
      <p className="eyebrow">Built for the booth</p>
      <h2 id="features-title" className="mt-3 text-3xl font-bold sm:text-4xl">One desktop workspace for the service.</h2>
      <p className="mt-4 max-w-3xl leading-7 text-slate-300">From the first spoken reference to the next song, slide or live source: prepare the content, preview your choices, and decide what the congregation sees.</p>
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(compact ? FEATURES.slice(0, 6) : FEATURES).map((feature) => (
          <article key={feature.title} className="glass rounded-2xl p-6">
            <span className="text-2xl text-blue-200" aria-hidden="true">{feature.icon}</span>
            <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{feature.description}</p>
          </article>
        ))}
      </div>
      {compact && <a href="/features" className="btn-secondary mt-7 inline-flex">Explore all features →</a>}
    </section>
  );
}
