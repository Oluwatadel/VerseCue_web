import OperatorDemo from "./OperatorDemo";

export default function Hero() {
  return (
    <section className="container-x grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:py-20" aria-labelledby="hero-title">
      <div>
        <p className="mb-6 inline-flex rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-200">Windows desktop · Built for church media</p>
        <h1 id="hero-title" className="text-4xl font-black leading-[1.05] sm:text-6xl lg:text-7xl">Right Verse.<span className="block bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">Right Time.</span></h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">Bring Bible lookup, projection, songs, slides and video into one free desktop workspace for preachers and church media teams.</p>
        <p className="mt-4 max-w-xl leading-7 text-slate-400">Activate optional AI transcription and automatic verse detection when you need them. Preview, queue and choose what reaches the congregation.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/download" className="btn-primary">Download for Windows — free</a>
          <a href="/account/activate" className="btn-secondary">Activate AI features</a>
          <a href="/docs/getting-started" className="btn-secondary">Get started</a>
        </div>
        <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-200" aria-label="Product highlights">
          <li>Parakeet included</li><li>Local speech processing</li><li>Operator-controlled display</li>
        </ul>
      </div>
      <OperatorDemo />
    </section>
  );
}
