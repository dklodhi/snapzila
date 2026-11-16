import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SnapZila — Live updates for career & education opportunities",
  description:
    "Data Driven Event Centric Live Update System for Career & Education. Govt Jobs, Admissions, Scholarships, Govt Schemes, News, Articles — with real-time live updates.",
  metadataBase: new URL("https://snapzila.com"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
