// Helpers for the Parallels pages: links, lookup parsing, grouping, and the trail.
import type { ApiBibleParallel, ApiScriptureParallel } from "@/libs/urantiaApi/types";


export const PARALLELS_ROOT = "/explore/parallels";

// A text as the lookup box needs it: its URL name and its ref prefix ("Dhp", "BG").
export type CorpusRef = { slug: string; refPrefix: string };

export type Lookup =
  | { kind: "paragraph"; ref: string }
  | { kind: "passage"; slug: string; ref: string }
  | { kind: "search"; q: string };

const PARAGRAPH_REF = /^(\d{1,3}):(\d{1,2})\.(\d{1,3})$/;
// The Bible is not a scripture corpus on the API, so the box knows a few book names.
const BIBLE_REF = /^(?:([1-3]?\s?[A-Za-z]+)\.?\s+)(\d{1,3})[:.](\d{1,3})$/;
const BIBLE_BOOKS: Record<string, string> = {
  genesis: "Gen", gen: "Gen", exodus: "Exod", exod: "Exod", psalm: "Ps", psalms: "Ps", ps: "Ps",
  proverbs: "Prov", prov: "Prov", isaiah: "Isa", isa: "Isa", matthew: "Matt", matt: "Matt", mt: "Matt",
  mark: "Mark", mk: "Mark", luke: "Luke", lk: "Luke", john: "John", jn: "John", romans: "Rom", rom: "Rom",
};

/** Reads the lookup box: a Urantia ref, a scripture ref such as "Dhp 5", or words to search by meaning. */
export function parseLookup(input: string, corpora: CorpusRef[]): Lookup {
  const s = input.trim().replace(/\s+/g, " ");
  if (PARAGRAPH_REF.test(s)) return { kind: "paragraph", ref: s };
  // Longest prefix first, so "Epictetus" is not read as a shorter prefix.
  const byPrefix = [...corpora].sort((a, b) => b.refPrefix.length - a.refPrefix.length);
  for (const c of byPrefix) {
    const prefix = c.refPrefix.toLowerCase();
    const lower = s.toLowerCase();
    if (lower.startsWith(`${prefix} `) || lower.startsWith(`${prefix}.`)) {
      const ref = s.slice(c.refPrefix.length).replace(/^[\s.]+/, "").replace(/:/g, ".");
      if (/^\d{1,4}(\.\d{1,4}){0,2}(-\d{1,4})?$/.test(ref)) return { kind: "passage", slug: c.slug, ref };
    }
  }
  const bible = s.match(BIBLE_REF);
  const book = bible ? BIBLE_BOOKS[(bible[1] as string).toLowerCase().replace(/\s/g, "")] : undefined;
  if (bible && book) return { kind: "passage", slug: "bible", ref: `${book}.${bible[2]}.${bible[3]}` };
  return { kind: "search", q: s };
}

export function paragraphPath(ref: string): string {
  return `${PARALLELS_ROOT}/${ref}`;
}

export function passagePath(slug: string, ref: string): string {
  return `${PARALLELS_ROOT}/${slug}/${ref}`;
}

/** The ref a passage page uses, without the text's prefix: "Dhp 3-5" becomes "3". */
export function passageRefFromLabel(label: string, refPrefix: string): string {
  const rest = label.startsWith(refPrefix) ? label.slice(refPrefix.length).trim() : label;
  // A chunk label can be a range ("BG 2.47-49"); its first passage names it.
  return rest.replace(/-\d+$/, "");
}

/** "Matt.5.43-48" becomes "Matt.5.43": the first verse of a Bible chunk. */
export function bibleRefFromChunkId(chunkId: string): string {
  return chunkId.replace(/-\d+$/, "");
}

type Scored = { similarity: number; corpus: { id: string } };

/** Groups passages by text, best match first in each group, groups sorted by their best match. */
export function groupByCorpus<T extends Scored>(items: T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(item.corpus.id, [...(groups.get(item.corpus.id) ?? []), item]);
  return Array.from(groups.values())
    .map((list) => [...list].sort((a, b) => b.similarity - a.similarity))
    .sort((a, b) => (b[0]?.similarity ?? 0) - (a[0]?.similarity ?? 0));
}

// Short names for the chips. A text not listed here shows its religion.
const SHORT_NAMES: Record<string, string> = {
  "diogenes-laertius-6": "Diogenes Laertius",
  "epictetus-cynic": "Epictetus",
  dhammapada: "Dhammapada",
  "bhagavad-gita": "Gita",
  "shinto-oracles": "Shinto oracles",
  "tao-te-ching": "Tao Te Ching",
  analects: "Analects",
  quran: "Quran",
  japji: "Japji",
  bible: "Bible",
};

export function shortName(corpus: { slug: string; religion: string }): string {
  return SHORT_NAMES[corpus.slug] ?? corpus.religion;
}

export function percent(similarity: number): string {
  return `${Math.round(similarity * 100)}%`;
}

// The trail is the reader's path through the links in this tab, newest last.
export type TrailStep = { href: string; label: string };
const TRAIL_KEY = "parallels-trail";
export const TRAIL_MAX = 12;

/** Adds a step. A step already on the trail cuts the trail back to it. */
export function nextTrail(trail: TrailStep[], step: TrailStep): TrailStep[] {
  const at = trail.findIndex((t) => t.href === step.href);
  if (at >= 0) return trail.slice(0, at + 1);
  return [...trail, step].slice(-TRAIL_MAX);
}

export function loadTrail(): TrailStep[] {
  try {
    const raw = window.sessionStorage.getItem(TRAIL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t?.href === "string" && typeof t?.label === "string") : [];
  } catch {
    return [];
  }
}

export function saveTrail(trail: TrailStep[]): void {
  try {
    window.sessionStorage.setItem(TRAIL_KEY, JSON.stringify(trail));
  } catch {
    // Storage can be off (private mode). The trail is a convenience only.
  }
}

// A scripture or Bible passage as a list shows it.
export type PassageItem = {
  key: string;
  href: string;
  reference: string;
  title: string;
  religion: string;
  translator: string;
  year: number;
  text: string;
  similarity: number;
};

// One group of passages per text, plus the Bible, ready for the chips and the cards.
export function compareGroups(p: {
  scriptureParallels: ApiScriptureParallel[];
  bibleParallels: ApiBibleParallel[];
}): { id: string; label: string; items: PassageItem[] }[] {
  const groups = groupByCorpus(p.scriptureParallels).map((list) => {
    const c = list[0]!.corpus;
    return {
      id: c.id,
      label: shortName(c),
      items: list.map((s) => ({
        key: s.chunkId,
        href: passagePath(c.slug, passageRefFromLabel(s.reference, c.refPrefix)),
        reference: s.reference,
        title: c.title,
        religion: c.religion,
        translator: c.translator,
        year: c.year,
        text: s.text,
        similarity: s.similarity,
      })),
    };
  });
  if (p.bibleParallels.length) {
    const bible = {
      id: "bible",
      label: "Bible",
      items: p.bibleParallels.map((b) => ({
        key: b.chunkId,
        href: passagePath("bible", bibleRefFromChunkId(b.chunkId)),
        reference: b.reference,
        title: "World English Bible",
        religion: "Judaism and Christianity",
        translator: "World English Bible",
        year: 2000,
        text: b.text,
        similarity: b.similarity,
      })),
    };
    // The Bible takes its place by its best match, like the other texts.
    const at = groups.findIndex((g) => (g.items[0]?.similarity ?? 0) < (bible.items[0]?.similarity ?? 0));
    groups.splice(at < 0 ? groups.length : at, 0, bible);
  }
  return groups;
}


// How the four insight lists are measured, in plain words. Shown on each list.
export const INSIGHTS_METHOD =
  "For each of the ten texts (the nine world religions texts and the Bible), a paragraph's closest passage is ranked against every other paragraph's, after an adjustment for paragraph length. \"Close in a text\" means the paragraph is in that text's top 10%. The texts often move together, because a paragraph that sounds devotional is close to many of them, so a count of texts is not a count of independent votes. Leans and pairs must hold under two different embedding models. All of this measures closeness in meaning by a language model. It does not say that two teachings are the same, or where any text came from.";

export const PART_FILTERS: { id: string; label: string }[] = [
  { id: "", label: "All parts" },
  { id: "1", label: "Part I" },
  { id: "2", label: "Part II" },
  { id: "3", label: "Part III" },
  { id: "4", label: "Part IV" },
];

/** Builds a list URL with only the non-empty query values. */
export function listHref(path: string, params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "" && v !== 0) q.set(k, String(v));
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}
