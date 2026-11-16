import type { Metadata } from "next";
import { PublicShell } from "@/components/public/public-shell";
import { ContactForm } from "./contact-form";
import { contactMetadata } from "@/lib/seo/metadata";


export const metadata: Metadata = contactMetadata();
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;

  return (
    <PublicShell>
      <div className="container-app py-8">
        <ContactForm submitted={submitted === "1"} />
      </div>
    </PublicShell>
  );
}
