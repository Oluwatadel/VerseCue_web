import OperatorDemo from "./OperatorDemo";

export default function Hero() {
  return (
    <section className="container-x grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:py-20" aria-labelledby="hero-title">
      <div>
        <p className="mb-6 inline-flex rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-700">Windows desktop · Built for church media</p>
        <h1 id="hero-title" className="hero-title text-5xl sm:text-6xl lg:text-7xl">The Word,<span className="block">Made Visible.</span></h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">Bring Bible lookup, projection, songs, slides and video into one free desktop workspace for preachers and church media teams.</p>
        <p className="mt-4 max-w-xl leading-7 text-slate-500">Activate optional AI transcription and automatic verse detection when you need them. The next desktop update also turns saved transcripts into editable sermon notes with dated PDF and Word exports. Preview, queue and choose what reaches the congregation.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/download" className="btn-primary">Download for Windows — free</a>
          <a href="/pricing" className="btn-secondary">Personal & organisation plans</a>
          <a href="/docs/getting-started" className="btn-secondary">Get started</a>
        </div>
        <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-700" aria-label="Product highlights">
          <li>Parakeet included</li><li>Local speech processing</li><li>Operator-controlled display</li>
        </ul>
      </div>
      <OperatorDemo />
    </section>
  );
}
