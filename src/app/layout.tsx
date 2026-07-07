import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShadowVault — Premium Game Panels & Mod Marketplace",
  description:
    "India's most premium digital delivery platform. Instant payment, instant unlock, secure file delivery for game panels, mods, configs and premium files.",
  keywords: [
    "ShadowVault",
    "game panels",
    "mod marketplace",
    "digital delivery",
    "gaming tools",
    "Razorpay",
  ],
  authors: [{ name: "ShadowVault" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ShadowVault — Premium Game Panels & Mod Marketplace",
    description:
      "Instant payment. Instant unlock. Secure digital delivery for gamers.",
    siteName: "ShadowVault",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
