import "~/styles/globals.css";

import { type Metadata } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";

import { JsonLd } from "~/components/scu/json-ld";
import { SiteHeader } from "~/components/scu/site-header";
import { SITE_URL } from "~/lib/scu/constants";
import {
  buildOrganizationLd,
  buildWebSiteLd,
} from "~/lib/scu/structured-data";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Microsoft Security Copilot SCU Calculator",
    template: "%s | SCU Calculator",
  },
  description:
    "Free Microsoft Security Copilot SCU calculator. Estimate Security Compute Unit cost, included E5 and E7 SCUs, and per-agent consumption with Microsoft-sourced formulas.",
  applicationName: "SCU Calculator",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/`,
    siteName: "SCU Calculator",
    title: "Microsoft Security Copilot SCU Calculator",
    description:
      "Estimate Microsoft Security Copilot SCU cost. Includes E5 and E7 auto-inclusion formula and per-agent SCU consumption.",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Security Copilot SCU Calculator" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Microsoft Security Copilot SCU Calculator",
    description:
      "Free SCU cost estimator with the official E5 and E7 inclusion formula.",
    images: ["/og.png"],
  },
  category: "technology",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
};

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${ibmPlexMono.variable}`}>
      <body>
        <JsonLd id="ld-organization" data={buildOrganizationLd()} />
        <JsonLd id="ld-website" data={buildWebSiteLd()} />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
