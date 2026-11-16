import { PublicShell } from "@/components/public/public-shell";
import { ContactForm } from "./contact-form";

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
