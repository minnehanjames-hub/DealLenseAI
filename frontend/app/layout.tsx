import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealLenseAI | M&A Intelligence Platform",
  description: "M&A intelligence for valuation trends, buyer behavior, and sector momentum."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

