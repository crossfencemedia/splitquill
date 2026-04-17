import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Splitquill — Branch into wonder",
  description: "A personalized AI storybook where your child is the hero. Pick a premise, upload their photo, and watch them star in a branching illustrated adventure.",
  metadataBase: new URL("https://splitquill.vercel.app"),
  openGraph: {
    title: "Splitquill — Branch into wonder",
    description: "A branching adventure story where your child is the hero — illustrated just for them.",
    url: "https://splitquill.vercel.app",
    siteName: "Splitquill",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Splitquill — Branch into wonder",
    description: "A branching adventure story where your child is the hero — illustrated just for them.",
  },
  other: {
    "theme-color": "#7C3AED",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="theme-color" content="#7C3AED" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
