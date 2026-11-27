"use client";

import Image from "next/image";
import { useState } from "react";

const VIEWS = [
  { label: "Live dashboard", src: "/screenshots/studio-dashboard.png", width: 1600, height: 960, description: "The Studio workspace keeps the Bible library, prepared preview, live display, transcription and recent detections together. This isolated capture uses a small test Bible library; it is not a speech-accuracy benchmark." },
  { label: "Preview highlighting", src: "/screenshots/preview-highlighting.png", width: 1600, height: 960, description: "Select words directly in Preview, highlight them or adjust text size, then choose Update screen. Your prepared changes stay separate from the live output until applied." },
  { label: "Text and banners", src: "/screenshots/text-banners.png", width: 1600, height: 960, description: "Prepare normal announcements or moving banners. Choose colours, direction, top or bottom placement and an automatic hide time. Stop banner removes the overlay while keeping the underlying content." },
];

export default function DesktopWorkspace() {
  const [selected, setSelected] = useState(0);
  const view = VIEWS[selected];
  return (
    <section id="workspace" className="container-x pb-16 sm:pb-20" aria-labelledby="workspace-title">
      <div className="max-w-3xl">
        <p className="eyebrow">Inside the desktop app</p>
        <h2 id="workspace-title" className="mt-3 text-3xl font-bold sm:text-4xl">See your choices before the congregation does.</h2>
        <p className="mt-4 leading-7 text-slate-600">Follow transcription, review recent detections and prepare the next verse from the main dashboard. Explore the current Studio workflow, preview highlighting and announcement controls.</p>
      </div>
      <div className="mt-7 flex flex-wrap gap-2" aria-label="Desktop screenshots">
        {VIEWS.map((item, index) => <button key={item.label} type="button" aria-pressed={selected === index}
          onClick={() => setSelected(index)} className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${selected === index ? "border-blue-300/50 bg-blue-400/15 text-blue-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{item.label}</button>)}
      </div>
      <figure className="glass mt-5 overflow-hidden rounded-xl">
        <div className="flex min-h-0 justify-center bg-slate-950/70 p-2 sm:p-4">
          <Image key={view.src} src={view.src} width={view.width} height={view.height} sizes="(max-width: 768px) 100vw, 1200px"
            alt={`verseVIO Windows desktop: ${view.description}`} className="h-auto max-h-[680px] w-auto max-w-full rounded-lg object-contain" />
        </div>
        <figcaption className="border-t border-slate-200 p-5">
          <p className="text-sm leading-6 text-slate-700">{view.description}</p>
          <p className="mt-2 text-xs text-slate-500">Actual desktop controls captured locally on 26 November 2026 with demonstration content. These development screenshots may be newer than the published installer. Appearance varies with theme and window size.</p>
        </figcaption>
      </figure>
    </section>
  );
}
