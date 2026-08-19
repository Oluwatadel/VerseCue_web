import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://versecue.app";
const title = "VerseCue — Right Verse. Right Time.";
const description =
  "VerseCue listens to the preacher, detects Bible references and Scripture paraphrases, and lets the media operator approve what reaches the screen. Intelligent Scripture presentation for live church services.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "VerseCue",
  keywords: [
    "VerseCue",
    "church media",
    "Scripture presentation",
    "sermon transcription",
    "live church technology",
    "Bible verse detection",
  ],
  authors: [{ name: "Airis IT Consult" }],
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "VerseCue",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "VerseCue — Right Verse. Right Time.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030b1c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
