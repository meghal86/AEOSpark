import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import Link from "next/link";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "AEOSpark | AI Visibility Score and Audit",
  description:
    "Measure how visible your company is to ChatGPT, Claude, and other AI assistants. Run a free score, then upgrade to a full AI visibility audit.",
  openGraph: {
    title: "AEOSpark | AI Visibility Score and Audit",
    description:
      "Run a free AI visibility score and see where competitors are being recommended instead of you.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AEOSpark | AI Visibility Score and Audit",
    description:
      "Run a free AI visibility score and find the prompts where competitors beat you.",
  },
};

export const viewport: Viewport = {
  colorScheme: "only light",
  themeColor: "#f4efe6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${cormorant.variable} antialiased`}>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-stone-600 md:px-10">
            <p>AEOSpark</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <a href="mailto:hello@aeospark.com">Contact</a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
