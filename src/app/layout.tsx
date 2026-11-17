import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SnapZila — Live updates for career & education opportunities",
    template: "%s — SnapZila",
  },
  description:
    "Data Driven Event Centric Live Update System for Career & Education. Govt Jobs, Admissions, Scholarships, Exams, Govt Schemes, News, Articles — with real-time live updates.",
  metadataBase: new URL("https://snapzila.com"),
  keywords: [
    "govt jobs", "government jobs", "admissions", "scholarships",
    "govt schemes", "exam calendar", "employment news", "exams",
    "SSC", "UPSC", "IBPS", "Railway", "live updates", "career",
    "education", "India", "SnapZila",
  ],
  authors: [{ name: "SnapZila" }],
  creator: "SnapZila",
  publisher: "SnapZila",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-IN": "/",
      "hi-IN": "/hi-in",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["hi_IN"],
    siteName: "SnapZila",
    title: "SnapZila — Live updates for career & education opportunities",
    description: "Govt Jobs, Admissions, Scholarships, Exams, Govt Schemes, News, Articles — with real-time live updates.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapZila — Live updates for career & education opportunities",
    description: "Govt Jobs, Admissions, Scholarships, Exams — with real-time live updates.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headerList = await headers();
  const locale = headerList.get("x-locale") || "en-IN";

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "SnapZila",
              url: "https://snapzila.com",
              description: "Data Driven Event Centric Live Update System for Career & Education.",
              inLanguage: locale,
              potentialAction: {
                "@type": "SearchAction",
                target: "https://snapzila.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
