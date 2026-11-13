import type { Metadata, Viewport } from "next";
import "./globals.css";
import {CountdownClock} from "./components/ExpiryCountdown";
import { PRODUCT } from "../lib/product";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://verse-cue-web.vercel.app";
const title = PRODUCT.title;
const description = PRODUCT.description;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "verseVIO",
  keywords: [
    "verseVIO",
    "church media",
    "Scripture presentation",
    "sermon transcription",
    "live church technology",
    "Bible verse detection",
    "Windows church presentation",
    "offline Scripture presentation",
    "Parakeet speech recognition",
    "church lyrics and slides",
  ],
  authors: [{ name: "Airis IT Consult" }],
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "verseVIO",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1254,
        height: 1254,
        alt: "verseVIO logo — The Word, Made Visible.",
      },
    ],
  },
  twitter: {
    card: "summary",
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
      <body><CountdownClock>{children}</CountdownClock></body>
    </html>
  );
}
