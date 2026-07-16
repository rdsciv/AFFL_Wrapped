import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://affl-history.ryan766604.chatgpt.site",
  ),
  title: { default: "AFFL History", template: "%s / AFFL" },
  description: "Advanced AFFL history, rebuilt season by season.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "AFFL Wrapped",
    description: "Twelve seasons of titles, luck, lineup decisions, transactions, and advanced fantasy history.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "AFFL Wrapped league history" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
