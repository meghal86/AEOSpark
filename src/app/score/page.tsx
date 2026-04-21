import { ScoreRunner } from "@/components/score-runner";
import { SiteHeader } from "@/components/site-header";

function decodeValue(value?: string | string[]) {
  if (!value) {
    return "";
  }
  return Array.isArray(value) ? value[0] : value;
}

export default async function ScoreEntryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const url = decodeValue(resolved.url);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-10 md:px-10">
      <SiteHeader />
      <ScoreRunner url={url} />
    </main>
  );
}
