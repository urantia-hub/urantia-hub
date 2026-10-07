// Node modules.
import type { GetServerSideProps } from "next";
// Relative modules.
import { LeanCard } from "@/components/parallels/InsightCards";
import InsightPage from "@/components/parallels/InsightPage";
import { fetchCorpora, fetchLeans, type LeanItem, type Paged } from "@/libs/urantiaApi/parallels";
import { INSIGHTS_METHOD, PARALLELS_ROOT, listHref, shortName } from "@/utils/parallels";

const PATH = `${PARALLELS_ROOT}/leans`;

type Props = { result: Paged<LeanItem>; text: string; texts: { slug: string; label: string }[] };

const Leans = ({ result, text, texts }: Props) => (
  <InsightPage
    title="Where paragraphs lean"
    path={PATH}
    intro="Paragraphs that come much closer to one text than to the others. Most leans follow a shared subject, such as John the Baptist in the Koran, or governing a state in the Tao Te Ching."
    method={INSIGHTS_METHOD}
    filters={[{ slug: "", label: "All texts" }, ...texts, { slug: "bible", label: "Bible" }].map((t) => ({
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
      <LeanCard key={item.paragraph.id} item={item} />
    ))}
  </InsightPage>
);

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, res }) => {
  const corpora = await fetchCorpora();
  const slugs = new Set([...corpora.map((c) => c.slug), "bible"]);
  const text = typeof query.text === "string" && slugs.has(query.text) ? query.text : "";
  const page = Math.max(0, Number.parseInt(String(query.page ?? "0"), 10) || 0);
  const result = await fetchLeans({ corpus: text || undefined, page, limit: 20 });
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
  return { props: { result, text, texts: corpora.map((c) => ({ slug: c.slug, label: shortName(c) })) } };
};

export default Leans;
