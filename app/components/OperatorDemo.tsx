"use client";

import { useState } from "react";

const PASSAGES = [
  { reference: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { reference: "Psalm 19:1", text: "The heavens declare the glory of God; and the firmament sheweth his handywork." },
];

export default function OperatorDemo() {
  const [selected, setSelected] = useState(0);
  const [displayed, setDisplayed] = useState<number | null>(null);
  const [queued, setQueued] = useState<number[]>([]);
  const [detections, setDetections] = useState([0, 1]);
  function display(index: number) {
    setSelected(index);
    setDisplayed(index);
    setDetections((items) => items.filter((item) => item !== index));
  }
  return (
    <div className="glass rounded-3xl p-4 sm:p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-blue-200">Interactive walkthrough · sample content</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Recent detections</p>
          <div className="mt-3 space-y-2">
            {detections.map((index) => (

              <button key={PASSAGES[index].reference} type="button" aria-pressed={selected === index}
                onClick={() => setSelected(index)} onDoubleClick={() => display(index)}
                className={`w-full rounded-xl border p-3 text-left transition ${selected === index ? "border-blue-400 bg-blue-400/10" : "border-white/10 hover:border-blue-400/60"}`}>
                <span className="block font-semibold">{PASSAGES[index].reference}</span>
                <span className="mt-1 block text-xs text-slate-300">Sample detection · KJV</span>
              </button>
            ))}
            {detections.length === 0 && <p className="text-sm leading-6 text-slate-300">Both sample detections have been displayed.</p>}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-400">Click once to preview. Double-click to display in this demo.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4" aria-live="polite">
          <p className="text-xs uppercase tracking-wider text-blue-200">Operator preview</p>
          <p className="mt-4 font-semibold text-blue-200">{PASSAGES[selected].reference} (KJV)</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">{PASSAGES[selected].text}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary flex-1 text-sm" disabled={queued.includes(selected)}
          onClick={() => setQueued((items) => [...items, selected])}>{queued.includes(selected) ? "Queued" : "+ Queue"}</button>
        <button type="button" className="btn-primary flex-1 text-sm" onClick={() => display(selected)}>Display sample</button>
      </div>
      <div className="mt-3 rounded-2xl bg-gradient-to-br from-blue-950 to-slate-950 p-4" aria-live="polite">
        <p className="text-xs uppercase tracking-wider text-emerald-200">Demo output · {displayed === null ? "Nothing displayed" : PASSAGES[displayed].reference}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{displayed === null ? "Previewing a passage keeps the output unchanged until you choose Display." : PASSAGES[displayed].text}</p>
        {queued.length > 0 && <p className="mt-3 text-xs text-blue-200">Bookmarked: {queued.map((index) => PASSAGES[index].reference).join(", ")}</p>}
      </div>
      <button type="button" className="mt-3 text-xs text-blue-200 underline underline-offset-4" onClick={() => { setSelected(0); setDisplayed(null); setQueued([]); setDetections([0, 1]); }}>Reset walkthrough</button>
      <p className="mt-3 text-xs leading-5 text-slate-400">This demonstration uses fixed Bible passages. It does not listen to your microphone or connect to a projector.</p>
    </div>
  );
}
