const FEATURES = [
  {
    icon: "🎙️",
    title: "Listen & Transcribe",
    description: "Follow the preacher's words in real time.",
  },
  {
    icon: "🔎",
    title: "Find Scripture",
    description:
      "Detect references or discover passages from paraphrased Scripture.",
  },
  {
    icon: "🖥️",
    title: "Approve & Display",
    description:
      "Preview, choose a translation, and decide what reaches the projector.",
  },
];

export default function Features() {
  return (
    <section id="features" className="container-x py-20 sm:py-24">
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
        Built for the booth
      </p>
      <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
        Less searching. More serving.
      </h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="glass rounded-2xl p-6 sm:p-7">
            <div className="text-3xl" aria-hidden="true">
              {feature.icon}
            </div>
            <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
            <p className="mt-3 leading-7 text-slate-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
