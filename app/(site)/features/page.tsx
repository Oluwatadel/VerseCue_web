import type { Metadata } from "next";
import Link from "next/link";
import Features from "../../components/Features";
import HowItWorks from "../../components/HowItWorks";
export const metadata: Metadata = { title: "Features | VerseCue", description: "Explore local transcription, Scripture detection, queues, media tools and preview controls in VerseCue for Windows." };
export default function FeaturesPage() {
  return <><header className="container-x pt-14"><p className="eyebrow">The desktop workspace</p><h1 className="page-title">Tools for the whole service.</h1><p className="page-intro">Listen locally, review Scripture suggestions, prepare the next reading and manage the media your congregation sees.</p></header><Features /><HowItWorks /><div className="container-x flex flex-wrap gap-3 py-12"><Link href="/download" className="btn-primary">Get VerseCue for Windows</Link><Link href="/docs" className="btn-secondary">Read the user guides</Link></div></>;
}
