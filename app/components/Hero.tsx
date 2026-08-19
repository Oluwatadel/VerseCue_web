export default function Hero() {
  return (
    <section className="container-x grid items-center gap-12 py-14 sm:py-16 lg:min-h-[78vh] lg:grid-cols-2 lg:py-20">
      <div>
        <div className="mb-6 inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-200">
          Intelligent Scripture presentation for live ministry
        </div>
        <h1 className="max-w-3xl text-4xl font-black leading-[1.05] sm:text-6xl lg:text-7xl">
          Right Verse.
          <span className="block bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Right Time.
          </span>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
          VerseCue listens to the preacher, detects Bible references and
          Scripture paraphrases, finds possible passages, and lets the media
          operator approve what reaches the screen.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <a href="#waitlist" className="btn-primary">
            Get Early Access
          </a>
          <a href="#how" className="btn-secondary">
            See How It Works
          </a>
        </div>
      </div>

      <div className="glass rounded-3xl p-4 sm:p-5">
        <div className="rounded-2xl bg-slate-950/80 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Live Transcription</p>
              <p className="font-semibold">Listening...</p>
            </div>
            <span className="whitespace-nowrap rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
              High confidence
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 p-5 text-sm leading-7 text-slate-300">
            &ldquo;...for God so loved the world that he gave his only
            begotten Son...&rdquo;
          </div>

          <div className="mt-4 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-5">
            <p className="text-xs uppercase tracking-wider text-violet-300">
              Possible Scripture
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xl font-bold">John 3:16</p>
                <p className="text-sm text-slate-400">95% match</p>
              </div>
              <button
                type="button"
                className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold"
              >
                Preview
              </button>
            </div>
          </div>

          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold"
          >
            Approve &amp; Display
          </button>
        </div>
      </div>
    </section>
  );
}
