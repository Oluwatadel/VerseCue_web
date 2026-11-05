import type { Metadata } from "next";
import Link from "next/link";
import {DownloadAccess} from "../../components/DownloadAccess";
import { getWindowsInstallerUrl } from "../../../lib/site-config";
export const metadata: Metadata = { title: "Download VerseCue | Windows", description: "Get the VerseCue Windows installer when published. macOS and Linux versions are coming soon." };
export default function DownloadPage() {
  const windowsUrl = getWindowsInstallerUrl();
  return <div className="container-x py-14 sm:py-20"><p className="eyebrow">VerseCue downloads</p><h1 className="page-title">Bring VerseCue to your service computer.</h1><p className="page-intro">Create a free account with your email and organisation name, then download and install VerseCue. Bible lookup, projection, songs, slides and video work without activation. AI transcription and automatic verse detection are optional activated features. The Windows installer link will appear when published.</p>
    <div className="mt-9 grid gap-5 lg:grid-cols-[1.4fr_1fr_1fr]">
      <section className="rounded-3xl border border-blue-300/30 bg-blue-400/10 p-7"><span className="badge">Windows desktop</span><h2 className="mt-5 text-2xl font-bold">VerseCue for Windows</h2><p className="mt-4 leading-7 text-slate-300">The desktop app includes VerseCue Clarity as its default speech model, with operator previews, Scripture queues and church media tools.</p>
        <DownloadAccess available={!!windowsUrl}/>
        <Link href="/account/activate" className="mt-4 block text-sm text-blue-200 underline">Activate optional AI features →</Link><p className="mt-4 text-sm leading-6 text-slate-400">{windowsUrl ? "Run the downloaded installer and follow its setup instructions." : "Download placeholder — the installer URL has not been published yet."}</p></section>
      {['macOS', 'Linux'].map((os) => <section key={os} className="glass rounded-3xl p-7"><span className="badge">Coming soon</span><h2 className="mt-5 text-2xl font-bold">VerseCue for {os}</h2><p className="mt-4 leading-7 text-slate-300">Availability and supported system requirements will be shared when this version is ready.</p><button type="button" disabled className="btn-secondary mt-7">{os} coming soon</button></section>)}
    </div>
    <div className="mt-8 grid gap-5 md:grid-cols-2"><section className="glass rounded-2xl p-6"><h2 className="text-xl font-semibold">Before you install</h2><p className="mt-3 leading-7 text-slate-300">Final installer requirements, release details and verification information will be published with the download. Plan a rehearsal with your microphone, Bible files and display before using a new build in a live service.</p><Link href="/docs/getting-started" className="mt-4 inline-flex text-blue-200 underline underline-offset-4">Read the setup guide →</Link></section><section className="glass rounded-2xl p-6"><h2 className="text-xl font-semibold">Updating an existing setup?</h2><p className="mt-3 leading-7 text-slate-300">Keep a backup of your Bible files, media and settings. Review the release notes and test the updated build before the service.</p><Link href="/releases" className="mt-4 inline-flex text-blue-200 underline underline-offset-4">View release notes →</Link></section></div>
  </div>;
}
