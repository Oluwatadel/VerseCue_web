import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PRODUCT } from "../lib/product";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://versecue.app";
const title = PRODUCT.title;
const description = PRODUCT.description;

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
    siteName: "VerseCue",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1254,
        height: 1254,
        alt: "VerseCue logo — Right Verse. Right Time.",
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
      <body>{children}</body>
    </html>
  );
}
