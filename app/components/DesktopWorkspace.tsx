"use client";

import Image from "next/image";
import { useState } from "react";

const VIEWS = [
  { label: "Live dashboard", src: "/screenshots/dashboard-transcription.png", width: 1800, height: 1061, description: "Follow a sample live transcript alongside recent detections, a bookmarked Bible queue and the operator's verse preview. Demonstration content and detection scores are illustrative, not measured accuracy." },
  { label: "Theme preview", src: "/screenshots/theme-preview.png", width: 1500, height: 900, description: "Compare a pending theme beside Preferences. Save applies it; Discard keeps the active theme." },
  { label: "Verse backgrounds", src: "/screenshots/background-preview.png", width: 900, height: 700, description: "Inspect the background behind verse text and adjust dimming before changing the live output." },
  { label: "Motion screensavers", src: "/screenshots/screensaver-preview.png", width: 900, height: 700, description: "See the selected screensaver without verse text. In the desktop app, moving media previews silently on repeat." },
  { label: "Speech models", src: "/screenshots/speech-models.png", width: 900, height: 700, description: "VerseCue Clarity is bundled. Choose an optional model from the dropdown to download it, then Save to activate it." },
];

export default function DesktopWorkspace() {
  const [selected, setSelected] = useState(0);
  const view = VIEWS[selected];
  return (
    <section id="workspace" className="container-x pb-16 sm:pb-20" aria-labelledby="workspace-title">
      <div className="max-w-3xl">
        <p className="eyebrow">Inside the desktop app</p>
        <h2 id="workspace-title" className="mt-3 text-3xl font-bold sm:text-4xl">See your choices before the congregation does.</h2>
        <p className="mt-4 leading-7 text-slate-300">Follow transcription, review recent detections and prepare the next verse from the main dashboard. Explore the gallery for appearance previews and speech-model controls.</p>
      </div>
      <div className="mt-7 flex flex-wrap gap-2" aria-label="Desktop screenshots">
        {VIEWS.map((item, index) => <button key={item.label} type="button" aria-pressed={selected === index}
          onClick={() => setSelected(index)} className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${selected === index ? "border-blue-300/50 bg-blue-400/15 text-blue-100" : "border-white/10 text-slate-300 hover:bg-white/5"}`}>{item.label}</button>)}
      </div>
      <figure className="glass mt-5 overflow-hidden rounded-2xl">
        <div className="flex min-h-0 justify-center bg-slate-950/70 p-2 sm:p-4">
          <Image key={view.src} src={view.src} width={view.width} height={view.height} sizes="(max-width: 768px) 100vw, 1200px"
            alt={`VerseCue Windows desktop: ${view.description}`} className="h-auto max-h-[680px] w-auto max-w-full rounded-lg object-contain" />
        </div>
        <figcaption className="border-t border-white/10 p-5">
          <p className="text-sm leading-6 text-slate-200">{view.description}</p>
          <p className="mt-2 text-xs text-slate-400">Current desktop interface with demonstration content. Screenshots are still images; appearance varies with the selected theme and window size.</p>
        </figcaption>
      </figure>
    </section>
  );
}
