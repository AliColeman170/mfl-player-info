import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import { UserProvider } from "@/components/Wallet/UserProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f5f9" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_SITE_URL),
  title: "MFL Player Info | Ratings Calculator & Contract Details",
  description:
    "Calculate the overall rating and get contract data for any Metaverse Football League (MFL) player using their player ID.",
  keywords: [
    "MFL",
    "@playMFL",
    "Metaverse",
    "Football",
    "league",
    "football",
    "calculator",
    "player",
    "ratings",
  ],
  authors: [
    { name: "Ali Coleman", url: "https://www.twitter.com/alicoleman170" },
  ],
  applicationName: "MFL Player Info",
  creator: "Ali Coleman",
  publisher: "Ali Coleman",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "MFL Player Info",
    description:
      "Calculate the overall rating and get contract data for any Metaverse Football League (MFL) player using their player ID.",
    siteName: "MFL Player Info",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MFL Player Info",
    description:
      "Calculate the overall rating and get contract data for any Metaverse Football League (MFL) player using their player ID.",
    site: "@alicoleman170",
    creator: "@alicoleman170",
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <UserProvider>
          <Header />
          <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1">
            {children}
          </main>
          <Footer />
        </UserProvider>
        <Analytics />
      </body>
    </html>
  );
}
