import { AuditCheckoutForm } from "@/components/audit-checkout-form";

function decodeValue(value?: string | string[]) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function AuditCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const companyName = decodeValue(resolved.company);
  const website = decodeValue(resolved.website);
  const scoreId = decodeValue(resolved.scoreId);
  const email = decodeValue(resolved.email);
  const name = decodeValue(resolved.name);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 md:px-10">
      <section className="grid gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
          Phase 3
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Paid audit conversion flow
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          This matches the FRD conversion step: one-page checkout, inline error on
          failure, immediate confirmation on success, and a client portal record for
          the downstream implementation workflow.
        </p>
      </section>

      <AuditCheckoutForm
        companyName={companyName}
        defaultEmail={email}
        defaultName={name}
        scoreId={scoreId}
        website={website}
      />
    </main>
  );
}
