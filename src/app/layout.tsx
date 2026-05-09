import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import Script from "next/script";

import { JsonLd } from "~/components/scu/json-ld";
import { SiteFooter } from "~/components/scu/site-footer";
import { SiteHeader } from "~/components/scu/site-header";
import { SITE_URL } from "~/lib/scu/constants";
import {
  buildOrganizationLd,
  buildPersonLd,
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
    locale: "en_US",
    title: "Microsoft Security Copilot SCU Calculator",
    description:
      "Estimate Microsoft Security Copilot SCU cost. Includes E5 and E7 auto-inclusion formula and per-agent SCU consumption.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Microsoft Security Copilot SCU Calculator",
    description:
      "Free SCU cost estimator with the official E5 and E7 inclusion formula.",
  },
  category: "technology",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1c22",
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
        <JsonLd id="ld-person" data={buildPersonLd()} />
        <JsonLd id="ld-website" data={buildWebSiteLd()} />
        <SiteHeader />
        {children}
        <div className="mx-auto w-full max-w-6xl px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] lg:pb-8">
          <SiteFooter />
        </div>
        <Script
          src="https://plausible.io/js/pa-UwVBku_4rNP-CtNb1IKhf.js"
          strategy="afterInteractive"
          async
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}
        </Script>
      </body>
    </html>
  );
}
