import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AdmissionSetu",
    template: "%s | AdmissionSetu",
  },
  description: "One admission journey. Every seat accounted for.",
  openGraph: {
    title: "AdmissionSetu",
    description: "One admission journey. Every seat accounted for.",
    images: [{ url: "/og.png", width: 1676, height: 941, alt: "AdmissionSetu — one admission journey, every seat accounted for" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AdmissionSetu",
    description: "One admission journey. Every seat accounted for.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
