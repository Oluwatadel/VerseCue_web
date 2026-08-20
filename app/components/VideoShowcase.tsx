// app/components/VideoShowcase.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function VideoShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!prefersReducedMotion) {
      video.play().then(
        () => setPlaying(true),
        () => setPlaying(false) // autoplay blocked by the browser — user can press play
      );
    }
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  return (
    <section className="container-x py-20 sm:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
          See it in action
        </p>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
          VerseCue, in 15 seconds
        </h2>
      </div>

      <div className="glass mx-auto mt-10 max-w-4xl rounded-3xl p-3 sm:p-4">
        <div className="group relative overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            className="aspect-video w-full"
            src="/video/versecue-advert.mp4"
            poster="/video/versecue-poster.jpg"
            muted
            loop
            playsInline
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />

          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause video" : "Play video"}
            className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20"
          >
            <span
              className={`inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg transition ${
                playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
              }`}
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-6 w-6 translate-x-0.5" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}