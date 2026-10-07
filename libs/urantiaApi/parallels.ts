/**
 * api.urantia.dev calls for the Parallels pages: Urantia paragraphs with their closest
 * scripture and Bible passages, and scripture passages with their closest paragraphs.
 */
import type { ApiBibleParallel, ApiScriptureParallel } from "./types";

const API_HOST = process.env.NEXT_PUBLIC_URANTIA_DEV_API_HOST;

export type ApiCorpus = ApiScriptureParallel["corpus"] & {
  sourceUrl: string;
  license: string;
  passageCount: number;
  refLevels: number;
  notes: string | null;
};

// A Urantia paragraph as a parallels list shows it.
export type ParallelParagraph = {
  id: string; // globalId, the anchor in the reader
  standardReferenceId: string;
  paperId: string;
  paperTitle: string;
  sectionTitle: string | null;
  text: string;
  similarity: number;
  rank: number;
};

export type ParagraphWithParallels = {
  id: string;
  standardReferenceId: string;
  paperId: string;
  paperTitle: string;
  sectionTitle: string | null;
  text: string;
  scriptureParallels: ApiScriptureParallel[];
  bibleParallels: ApiBibleParallel[];
  scriptureScores: ParagraphScores | null;
  navigation: { prev: string | null; next: string | null };
};

// One scripture or Bible passage with its closest Urantia paragraphs.
export type PassageWithParallels = {
  slug: string; // the corpus slug, or "bible"
  reference: string; // the chunk label, such as "Dhp 3-5"
  passageRef: string; // the passage asked for, such as "Dhp 5"
  title: string;
  religion: string;
  translator: string;
  year: number;
  divisionTitle: string | null;
  sourceUrl: string | null;
  text: string;
  urantiaParallels: ParallelParagraph[];
};

export class NotFoundError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_HOST}${path}`);
  if (res.status === 404 || res.status === 400) throw new NotFoundError(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchCorpora(): Promise<ApiCorpus[]> {
  return (await getJson<{ data: ApiCorpus[] }>("/scriptures")).data;
}

export async function fetchParagraphWithParallels(ref: string): Promise<ParagraphWithParallels> {
  const json = await getJson<{
    data: Omit<ParagraphWithParallels, "navigation">;
    navigation: { prev: string | null; next: string | null };
  }>(`/paragraphs/${encodeURIComponent(ref)}?include=scriptureParallels,bibleParallels,scriptureScores`);
  const d = json.data;
  return {
    id: d.id,
    standardReferenceId: d.standardReferenceId,
    paperId: d.paperId,
    paperTitle: d.paperTitle,
    sectionTitle: d.sectionTitle,
    text: d.text,
    scriptureParallels: d.scriptureParallels ?? [],
    bibleParallels: (d.bibleParallels ?? []).slice(0, 3),
    scriptureScores: d.scriptureScores ?? null,
    navigation: json.navigation ?? { prev: null, next: null },
  };
}

export async function fetchPassageWithParallels(slug: string, ref: string): Promise<PassageWithParallels> {
  if (slug === "bible") return fetchBibleVerse(ref);
  const json = await getJson<{
    data: {
      corpus: ApiScriptureParallel["corpus"];
      passage: { ref: string; divisionTitle: string | null };
      chunk: { reference: string; text: string };
      urantiaParallels: ParallelParagraph[];
    };
  }>(`/scriptures/${encodeURIComponent(slug)}/${encodeURIComponent(ref)}/urantia-parallels`);
  const { corpus, passage, chunk, urantiaParallels } = json.data;
  return {
    slug: corpus.slug,
    reference: chunk.reference,
    passageRef: passage.ref,
    title: corpus.title,
    religion: corpus.religion,
    translator: corpus.translator,
    year: corpus.year,
    divisionTitle: passage.divisionTitle,
    sourceUrl: null,
    text: chunk.text,
    urantiaParallels,
  };
}

// A Bible ref here is "Matt.5.3": book, chapter, verse.
async function fetchBibleVerse(ref: string): Promise<PassageWithParallels> {
  const m = ref.match(/^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/);
  if (!m) throw new NotFoundError(ref);
  const json = await getJson<{
    data: {
      verse: { reference: string };
      chunk: { reference: string; text: string };
      urantiaParallels: ParallelParagraph[];
    };
  }>(`/bible/${m[1]}/${m[2]}/${m[3]}/urantia-parallels`);
  const { verse, chunk, urantiaParallels } = json.data;
  return {
    slug: "bible",
    reference: chunk.reference,
    passageRef: verse.reference,
    title: "World English Bible",
    religion: "Judaism and Christianity",
    translator: "World English Bible",
    year: 2000,
    divisionTitle: null,
    sourceUrl: null,
    text: chunk.text,
    urantiaParallels,
  };
}

export type SearchResults = {
  paragraphs: ParallelParagraph[];
  passages: ApiScriptureParallel[];
};

/** Search by meaning in the Papers and in the scriptures, in parallel. Runs in the browser. */
export async function searchParallels(q: string): Promise<SearchResults> {
  const post = (path: string, body: unknown) =>
    fetch(`${API_HOST}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => {
      if (!r.ok) throw new Error(`${path}: ${r.status}`);
      return r.json();
    });
  const [ub, sc] = await Promise.all([
    post("/search/semantic", { q, limit: 5 }),
    post("/scriptures/search/semantic", { q, limit: 8, urantiaParallelLimit: 0 }),
  ]);
  return {
    paragraphs: (ub.data ?? []).map((p: ParallelParagraph, i: number) => ({ ...p, rank: i + 1 })),
    passages: (sc.data ?? []).map((p: ApiScriptureParallel & { chunkId: string }, i: number) => ({
      ...p,
      rank: i + 1,
      source: "semantic",
      embeddingModel: "text-embedding-3-small",
    })),
  };
}

// --- Insights: scores across the texts ---

type CorpusSummary = ApiScriptureParallel["corpus"];

export type InsightParagraph = {
  id: string;
  standardReferenceId: string;
  paperId: string;
  paperTitle: string;
  sectionTitle: string | null;
  text: string;
};

export type ScoredItem = {
  paragraph: InsightParagraph;
  textsClose: number;
  consensus: number;
  distance: number;
  closest: { corpus: CorpusSummary; percentile: number }[];
};

export type PairItem = {
  paragraph: InsightParagraph;
  corpus: CorpusSummary;
  passage: { chunkId: string; reference: string; text: string };
  similarity: number;
  similaritySmall: number;
};

export type LeanItem = { paragraph: InsightParagraph; corpus: CorpusSummary; gap: number; percentile: number };

export type Paged<T> = { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } };

export type ParagraphScores = {
  textsClose: number;
  consensus: number;
  distance: number;
  lean: { corpus: CorpusSummary; gap: number } | null;
  mutualPairs: { corpus: CorpusSummary; passage: { chunkId: string; reference: string; text: string } }[];
  profile: { corpus: CorpusSummary; percentile: number }[];
};

type InsightParams = Record<string, string | number | undefined>;

function query(params: InsightParams): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const fetchSharedCurrents = (p: InsightParams) =>
  getJson<Paged<ScoredItem>>(`/scriptures/insights/shared-currents${query(p)}`);
export const fetchFarFromTexts = (p: InsightParams) => getJson<Paged<ScoredItem>>(`/scriptures/insights/far${query(p)}`);
export const fetchMutualPairs = (p: InsightParams) => getJson<Paged<PairItem>>(`/scriptures/insights/pairs${query(p)}`);
export const fetchLeans = (p: InsightParams) => getJson<Paged<LeanItem>>(`/scriptures/insights/leans${query(p)}`);
