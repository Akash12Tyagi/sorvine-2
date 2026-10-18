import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { brand } from "@/lib/content";
import "./globals.css";

export const metadata: Metadata = {
  title: `${brand.name} | AI models and agents for your business`,
  description: brand.tagline,
  openGraph: {
    title: `${brand.name} | Turn your data into your smartest teammate`,
    description: brand.tagline,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <noscript>
          <style>{`[data-reveal],[data-s]{opacity:1!important;filter:none!important;transform:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
