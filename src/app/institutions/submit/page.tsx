import { Suspense } from "react";
import { PublicShell } from "@/components/public/public-shell";
import { SubmitForm } from "./submit-form";

export default async function SubmitInstitutionPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;

  return (
    <PublicShell>
      <div className="container-app py-8">
        <Suspense fallback={<div className="text-muted">Loading...</div>}>
          <SubmitForm submitted={submitted === "1"} />
        </Suspense>
      </div>
    </PublicShell>
  );
}
