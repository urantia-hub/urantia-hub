// Node modules.
import type { GetServerSideProps } from "next";
// Relative modules.
import { PairCard } from "@/components/parallels/InsightCards";
import InsightPage from "@/components/parallels/InsightPage";
import { fetchCorpora, fetchMutualPairs, type Paged, type PairItem } from "@/libs/urantiaApi/parallels";
import { INSIGHTS_METHOD, PARALLELS_ROOT, listHref, shortName } from "@/utils/parallels";

const PATH = `${PARALLELS_ROOT}/pairs`;

type Props = { result: Paged<PairItem>; text: string; texts: { slug: string; label: string }[] };

const Pairs = ({ result, text, texts }: Props) => (
  <InsightPage
    title="Pairs that find each other"
    path={PATH}
    intro="A paragraph and a passage that are each other's closest match, under two different embedding models. These are the steadiest links in the data. The Bible has most of them, so it has its own tab."
    method={INSIGHTS_METHOD}
    filters={[{ slug: "", label: "World religions" }, ...texts, { slug: "bible", label: "Bible" }].map((t) => ({
      label: t.label,
      href: listHref(PATH, { text: t.slug }),
      active: t.slug === text,
    }))}
    page={result.meta.page}
    totalPages={result.meta.totalPages}
    pageHref={(page) => listHref(PATH, { text, page })}
    empty={result.data.length === 0}
  >
    {result.data.map((item) => (
      <PairCard key={`${item.paragraph.id}:${item.passage.chunkId}`} item={item} />
    ))}
  </InsightPage>
);

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, res }) => {
  const corpora = await fetchCorpora();
  const slugs = new Set([...corpora.map((c) => c.slug), "bible"]);
  const text = typeof query.text === "string" && slugs.has(query.text) ? query.text : "";
  const page = Math.max(0, Number.parseInt(String(query.page ?? "0"), 10) || 0);
  const result = await fetchMutualPairs(
    text ? { corpus: text, page, limit: 20 } : { excludeBible: "true", page, limit: 20 },
  );
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
  return { props: { result, text, texts: corpora.map((c) => ({ slug: c.slug, label: shortName(c) })) } };
};

export default Pairs;
