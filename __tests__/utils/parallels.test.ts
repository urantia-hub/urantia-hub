import { describe, it, expect, afterEach, vi } from "vitest";
import {
  TRAIL_MAX,
  bibleRefFromChunkId,
  compareGroups,
  groupByCorpus,
  loadTrail,
  nextTrail,
  parseLookup,
  passageRefFromLabel,
  saveTrail,
  shortName,
} from "@/utils/parallels";

const corpora = [
  { slug: "dhammapada", refPrefix: "Dhp" },
  { slug: "bhagavad-gita", refPrefix: "BG" },
  { slug: "epictetus-cynic", refPrefix: "Epictetus" },
  { slug: "quran", refPrefix: "Quran" },
  { slug: "diogenes-laertius-6", refPrefix: "DL" },
];

describe("parseLookup", () => {
  it("reads a Urantia reference", () => {
    expect(parseLookup(" 140:3.15 ", corpora)).toEqual({ kind: "paragraph", ref: "140:3.15" });
  });

  it("reads scripture references with any case and separator", () => {
    expect(parseLookup("Dhp 5", corpora)).toEqual({ kind: "passage", slug: "dhammapada", ref: "5" });
    expect(parseLookup("bg 2:47", corpora)).toEqual({ kind: "passage", slug: "bhagavad-gita", ref: "2.47" });
    expect(parseLookup("Epictetus 3.22.45", corpora)).toEqual({ kind: "passage", slug: "epictetus-cynic", ref: "3.22.45" });
    expect(parseLookup("Quran 2:255", corpora)).toEqual({ kind: "passage", slug: "quran", ref: "2.255" });
  });

  it("reads a Bible reference for the books it knows", () => {
    expect(parseLookup("Matthew 5:44", corpora)).toEqual({ kind: "passage", slug: "bible", ref: "Matt.5.44" });
    expect(parseLookup("john 3:16", corpora)).toEqual({ kind: "passage", slug: "bible", ref: "John.3.16" });
  });

  it("treats anything else as a search by meaning", () => {
    expect(parseLookup("hatred ceases by love", corpora)).toEqual({ kind: "search", q: "hatred ceases by love" });
    expect(parseLookup("Dhp love", corpora)).toEqual({ kind: "search", q: "Dhp love" });
    expect(parseLookup("Hebrews 11:1", corpora)).toEqual({ kind: "search", q: "Hebrews 11:1" });
  });
});

describe("passage refs", () => {
  it("drops the prefix and the end of a range", () => {
    expect(passageRefFromLabel("Dhp 3-5", "Dhp")).toBe("3");
    expect(passageRefFromLabel("BG 2.47-49", "BG")).toBe("2.47");
    expect(passageRefFromLabel("Epictetus 3.22.45-49", "Epictetus")).toBe("3.22.45");
    expect(passageRefFromLabel("Oracle 15", "Oracle")).toBe("15");
  });

  it("takes the first verse of a Bible chunk", () => {
    expect(bibleRefFromChunkId("Matt.5.43-48")).toBe("Matt.5.43");
    expect(bibleRefFromChunkId("John.11.35")).toBe("John.11.35");
  });
});

const corpus = (id: string, slug: string, religion: string, refPrefix: string) => ({
  id, slug, religion, refPrefix, title: `Title ${id}`, translator: "T", year: 1900, urantiaSection: null,
});
const parallel = (c: ReturnType<typeof corpus>, reference: string, similarity: number) => ({
  chunkId: `${c.id}:${reference}`, reference, corpus: c, text: reference, similarity, rank: 1,
  source: "semantic", embeddingModel: "m",
});

describe("groupByCorpus and compareGroups", () => {
  const dhp = corpus("d", "dhammapada", "Buddhism", "Dhp");
  const dl = corpus("l", "diogenes-laertius-6", "Cynicism", "DL");
  const items = [parallel(dhp, "Dhp 3-5", 0.38), parallel(dl, "DL 6.20", 0.41), parallel(dhp, "Dhp 197-199", 0.39)];

  it("groups by text, best match first, best group first", () => {
    const groups = groupByCorpus(items);
    expect(groups.map((g) => g.map((p) => p.reference))).toEqual([["DL 6.20"], ["Dhp 197-199", "Dhp 3-5"]]);
  });

  it("names the chips by text, links each passage, and places the Bible by its best match", () => {
    const bible = [{ chunkId: "Matt.5.43-48", reference: "Matthew 5:43-48", text: "t", similarity: 0.4 }];
    const groups = compareGroups({ scriptureParallels: items, bibleParallels: bible as never });
    expect(groups.map((g) => g.label)).toEqual(["Diogenes Laertius", "Bible", "Dhammapada"]);
    expect(groups[1]!.items[0]!.href).toBe("/explore/parallels/bible/Matt.5.43");
    expect(groups[2]!.items[0]!.href).toBe("/explore/parallels/dhammapada/197");
  });

  it("falls back to the religion for a text with no short name", () => {
    expect(shortName({ slug: "avesta", religion: "Zoroastrianism" })).toBe("Zoroastrianism");
  });
});

describe("trail", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it("adds steps, cuts back to a step already there, and keeps the last steps only", () => {
    const a = { href: "/a", label: "a" };
    const b = { href: "/b", label: "b" };
    expect(nextTrail([a], b)).toEqual([a, b]);
    expect(nextTrail([a, b], a)).toEqual([a]);
    const long = Array.from({ length: TRAIL_MAX }, (_, i) => ({ href: `/${i}`, label: `${i}` }));
    expect(nextTrail(long, b)).toHaveLength(TRAIL_MAX);
    expect(nextTrail(long, b).at(-1)).toEqual(b);
  });

  it("saves and loads the trail, and survives storage that throws", () => {
    saveTrail([{ href: "/a", label: "a" }]);
    expect(loadTrail()).toEqual([{ href: "/a", label: "a" }]);
    window.sessionStorage.setItem("parallels-trail", "not json");
    expect(loadTrail()).toEqual([]);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadTrail()).toEqual([]);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveTrail([])).not.toThrow();
  });
});
