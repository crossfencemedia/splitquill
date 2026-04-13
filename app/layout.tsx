import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Splitquill — Branch into wonder",
  description: "A personalized AI storybook where your child is the hero.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
