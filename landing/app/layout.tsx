import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Amoeba - AI Content Generation Made Simple | $3.50",
  description: "Self-hosted AI microservices for $3.50. Bring your own keys, generate unlimited content with OpenAI, Anthropic, or Ollama (free).",
  keywords: ["AI content generation", "self-hosted", "OpenAI", "Anthropic", "Ollama", "microservices", "BYOK"],
  authors: [{ name: "Amoeba" }],
  openGraph: {
    title: "Amoeba - AI Content Generation for $3.50",
    description: "Self-hosted AI microservices. One payment, use forever.",
    url: "https://ameoba.org",
    siteName: "Amoeba",
    images: [
      {
        url: "https://ameoba.org/og-image.png",
        width: 1200,
        height: 630,
        alt: "Amoeba - AI Content Generation",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amoeba - AI Content Generation for $3.50",
    description: "Self-hosted AI microservices. One payment, use forever.",
    images: ["https://ameoba.org/og-image.png"],
    creator: "@ameobadev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
