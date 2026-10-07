// Node modules.
import type { GetServerSideProps } from "next";
// Relative modules.
import { ScoredCard } from "@/components/parallels/InsightCards";
import InsightPage from "@/components/parallels/InsightPage";
import { fetchSharedCurrents, type Paged, type ScoredItem } from "@/libs/urantiaApi/parallels";
import { INSIGHTS_METHOD, PARALLELS_ROOT, PART_FILTERS, listHref } from "@/utils/parallels";

const PATH = `${PARALLELS_ROOT}/currents`;

type Props = { result: Paged<ScoredItem>; part: string };

const SharedCurrents = ({ result, part }: Props) => (
  <InsightPage
    title="Shared currents"
    path={PATH}
    intro="Paragraphs that come close to many of the texts at once. Paper 131 is left out, because it is a collection of sayings from these religions."
    method={INSIGHTS_METHOD}
    filters={PART_FILTERS.map((f) => ({ label: f.label, href: listHref(PATH, { part: f.id }), active: f.id === part }))}
    page={result.meta.page}
    totalPages={result.meta.totalPages}
    pageHref={(page) => listHref(PATH, { part, page })}
    empty={result.data.length === 0}
  >
    {result.data.map((item) => (
      <ScoredCard key={item.paragraph.id} item={item} mode="currents" />
    ))}
  </InsightPage>
);

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, res }) => {
  const part = typeof query.part === "string" && /^[1-4]$/.test(query.part) ? query.part : "";
  const page = Math.max(0, Number.parseInt(String(query.page ?? "0"), 10) || 0);
  const result = await fetchSharedCurrents({ partId: part || undefined, page, limit: 20 });
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
  return { props: { result, part } };
};

export default SharedCurrents;
