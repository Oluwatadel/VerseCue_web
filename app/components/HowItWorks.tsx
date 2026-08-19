const STEPS = [
  {
    number: "01",
    title: "Listen",
    description: "VerseCue listens to the sermon.",
  },
  {
    number: "02",
    title: "Detect",
    description: "It recognizes references and paraphrases.",
  },
  {
    number: "03",
    title: "Review",
    description: "The operator previews possible matches.",
  },
  {
    number: "04",
    title: "Display",
    description: "Approved Scripture goes to the screen.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-y border-white/10 bg-white/[.025]">
      <div className="container-x py-20 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
          Listen. Detect. Approve. Display.
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 md:grid-cols-4">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-white/10 bg-slate-950/50 p-6"
            >
              <span className="text-sm text-blue-400">{step.number}</span>
              <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
