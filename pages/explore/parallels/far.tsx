// Node modules.
import type { GetServerSideProps } from "next";
// Relative modules.
import { ScoredCard } from "@/components/parallels/InsightCards";
import InsightPage from "@/components/parallels/InsightPage";
import { fetchFarFromTexts, type Paged, type ScoredItem } from "@/libs/urantiaApi/parallels";
import { INSIGHTS_METHOD, PARALLELS_ROOT, PART_FILTERS, listHref } from "@/utils/parallels";

const PATH = `${PARALLELS_ROOT}/far`;

type Props = { result: Paged<ScoredItem>; part: string };

const FarFromTexts = ({ result, part }: Props) => (
  <InsightPage
    title="Far from these texts"
    path={PATH}
    intro="Paragraphs with no close passage in any of the ten texts. Subjects the scriptures do not discuss, such as geology, rank high everywhere, so the list starts with Part I."
    method={INSIGHTS_METHOD}
    filters={PART_FILTERS.map((f) => ({
      label: f.label,
      href: listHref(PATH, { part: f.id || "all" }),
      active: (f.id || "all") === part,
    }))}
    page={result.meta.page}
    totalPages={result.meta.totalPages}
    pageHref={(page) => listHref(PATH, { part, page })}
    empty={result.data.length === 0}
  >
    {result.data.map((item) => (
      <ScoredCard key={item.paragraph.id} item={item} mode="far" />
    ))}
  </InsightPage>
);

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, res }) => {
  // Part I by default: across the whole book, the physical-history papers fill the list.
  const raw = typeof query.part === "string" ? query.part : "1";
  const part = /^[1-4]$/.test(raw) || raw === "all" ? raw : "1";
  const page = Math.max(0, Number.parseInt(String(query.page ?? "0"), 10) || 0);
  const result = await fetchFarFromTexts({ partId: part === "all" ? undefined : part, page, limit: 20 });
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
  return { props: { result, part } };
};

export default FarFromTexts;
