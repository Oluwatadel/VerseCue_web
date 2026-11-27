import type { Metadata } from "next";
import Link from "next/link";
import { DownloadAccess } from "../../components/DownloadAccess";
import { getAndroidInstallerUrl } from "../../../lib/site-config";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mobile Remote | verseVIO", description: "Download the Android companion and pair your phone with verseVIO desktop. Free presentation control for your service team." };
const activities = [
  ["Bible & display", "Browse book, chapter and verse grids, choose translations, prepare references and control the congregation display."],
  ["Songs, slides & media", "Use content already imported on the desktop. Prepare lyrics and slides, control desktop playback and switch supported live sources."],
  ["Queues & service plans", "Access the desktop Bible queue, display history and prepared service plan from a landscape operator workspace."],
  ["AI assistance", "Follow transcription and detections, work with notes and optionally send phone microphone audio. These AI functions require active desktop AI access."],
];
export default function RemotePage() {
  return <div className="container-x py-14 sm:py-20">
    <p className="eyebrow">Mobile companion</p><h1 className="page-title">Control verseVIO from your phone.</h1>
    <p className="page-intro">A separately installed landscape companion for the Windows desktop app. Presentation control is free for free and paid users. The desktop remains the computer that plays media, processes AI and sends the output to your screen.</p>
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <section className="glass rounded-xl p-7"><span className="badge">Android</span><h2 className="mt-4 text-2xl font-bold">Get verseVIO Remote</h2><p className="mt-3 leading-7 text-slate-600">Sign in with your free website account to download the Android APK when available. Open the download on your phone and follow Android’s installation prompts. Only install the official package reached through this website.</p><DownloadAccess available={!!getAndroidInstallerUrl()} platform="mobile"/></section>
      <section className="glass rounded-xl p-7"><span className="badge">Coming soon</span><h2 className="mt-4 text-2xl font-bold">iPhone & iPad</h2><p className="mt-3 leading-7 text-slate-600">An installable iOS release is not available yet. Installation details will appear here when a signed build is published. The Android APK cannot be installed on an iPhone.</p><Link href="/download" className="btn-secondary mt-6 inline-flex">Get the Windows desktop app</Link></section>
    </div>
    <section className="glass mt-8 rounded-xl p-6 sm:p-8"><h2 className="text-2xl font-bold">Connect in four steps</h2><ol className="mt-5 list-decimal space-y-4 pl-6 leading-7 text-slate-600"><li>Install and open the matching Windows desktop app. Sign in with your account.</li><li>Connect the phone and desktop to the same private Wi-Fi or LAN. In desktop Preferences → Mobile remote, choose the computer’s Wi-Fi/Ethernet address and select Start connection.</li><li>Open Remote on the phone, allow camera and local-network permissions, then scan the desktop’s connection QR. Use landscape for the operator workspace.</li><li>Prepare content in Preview, then Display when ready. End the connection on the desktop when finished.</li></ol><p className="mt-5 text-sm leading-7 text-slate-500">The download QR opens the website download page; the separate pairing QR connects your phone to that computer. Pairing codes expire after three minutes. Re-pair after restarting the desktop. Keep pairing codes private.</p></section>
    <div className="mt-8 grid gap-5 md:grid-cols-2">{activities.map(([title,body])=><section key={title} className="glass rounded-xl p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-slate-600">{body}</p></section>)}</div>
    <section className="glass mt-8 rounded-xl p-6"><h2 className="text-xl font-semibold">Before a live service</h2><p className="mt-3 leading-7 text-slate-600">Test on the actual church network. Guest-network isolation, VPNs and Windows firewall rules can block pairing. Keep the desktop running and permit its private-network connection. Phone previews are periodic snapshots, not a continuous video feed. Phone microphone reliability depends on the microphone and network; rehearse and keep a wired audio fallback.</p><Link href="/support" className="mt-4 inline-flex text-blue-700 underline">Need help connecting? →</Link></section>
  </div>;
}
