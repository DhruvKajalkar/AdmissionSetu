import type { Metadata } from "next";
import "./globals.css";

const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AdmissionSetu",
    template: "%s | AdmissionSetu",
  },
  description: "A simpler, safer engineering admission journey.",
  openGraph: {
    title: "AdmissionSetu",
    description: "A simpler, safer engineering admission journey.",
    images: [{ url: "/og.png", width: 1676, height: 941, alt: "AdmissionSetu — one admission journey, every seat accounted for" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AdmissionSetu",
    description: "A simpler, safer engineering admission journey.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
