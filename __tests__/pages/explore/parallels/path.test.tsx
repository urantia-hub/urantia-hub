import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/components/Navbar", () => ({ default: () => React.createElement("nav", { "data-testid": "navbar" }) }));
vi.mock("@/components/Footer", () => ({ default: () => React.createElement("footer") }));
vi.mock("@/components/HeadTag", () => ({ default: () => null }));
vi.mock("@/libs/analytics", () => ({ track: vi.fn() }));
vi.mock("@/libs/urantiaApi/parallels", async () => {
  const actual = await vi.importActual<typeof import("@/libs/urantiaApi/parallels")>("@/libs/urantiaApi/parallels");
  return { ...actual, fetchParagraphWithParallels: vi.fn(), fetchPassageWithParallels: vi.fn() };
});

import ParallelsPage, { getServerSideProps } from "@/pages/explore/parallels/[...path]";
import { NotFoundError, fetchParagraphWithParallels, fetchPassageWithParallels } from "@/libs/urantiaApi/parallels";

const corpus = (id: string, slug: string, religion: string, title: string) => ({
  id, slug, religion, title, refPrefix: id === "o" ? "Oracle" : "Dhp", translator: "A. T.", year: 1900, urantiaSection: null,
});
const oracles = corpus("o", "shinto-oracles", "Shinto", "Shinto Oracles");
const dhp = corpus("d", "dhammapada", "Buddhism", "The Dhammapada");
const paragraph = {
  id: "4:131.7.2",
  standardReferenceId: "131:7.2",
  paperId: "131",
  paperTitle: "The World's Religions",
  sectionTitle: "Shinto",
  text: "Says the Lord.",
  scriptureParallels: [
    { chunkId: "o:15", reference: "Oracle 15", corpus: oracles, text: "Of old the people", similarity: 0.67, rank: 1, source: "s", embeddingModel: "m" },
    { chunkId: "d:3", reference: "Dhp 3-5", corpus: dhp, text: "hatred ceases by love", similarity: 0.5, rank: 1, source: "s", embeddingModel: "m" },
  ],
  bibleParallels: [],
  navigation: { prev: "131:7.1", next: "131:7.3" },
};

describe("Parallels compare view", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("shows the paragraph, the closest text first, and links each passage", () => {
    render(<ParallelsPage kind="paragraph" paragraph={paragraph as never} />);
    expect(screen.getByRole("heading", { name: "131:7.2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Shinto oracles · 67%" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Oracle 15").closest("a")).toHaveAttribute("href", "/explore/parallels/shinto-oracles/15");
    expect(screen.getByRole("link", { name: "‹ 131:7.1" })).toHaveAttribute("href", "/explore/parallels/131:7.1");
    expect(screen.getByRole("link", { name: "Read in context" })).toHaveAttribute("href", expect.stringContaining("#4:131.7.2"));
  });

  it("switches texts with the chips", () => {
    render(<ParallelsPage kind="paragraph" paragraph={paragraph as never} />);
    fireEvent.click(screen.getByRole("tab", { name: "Dhammapada · 50%" }));
    expect(screen.getByText("Dhp 3-5").closest("a")).toHaveAttribute("href", "/explore/parallels/dhammapada/3");
    expect(screen.queryByText("Oracle 15")).toBeNull();
  });

  it("shows the score line with links to the lists and the pair", () => {
    const scores = {
      textsClose: 8,
      consensus: 0.9,
      distance: 0.02,
      lean: { corpus: oracles, gap: 0.2 },
      mutualPairs: [{ corpus: oracles, passage: { chunkId: "o:15", reference: "Oracle 15", text: "t" } }],
      profile: [],
    };
    render(<ParallelsPage kind="paragraph" paragraph={{ ...paragraph, scriptureScores: scores } as never} />);
    expect(screen.getByRole("link", { name: "Close in 8 of 10 texts" })).toHaveAttribute("href", "/explore/parallels/currents");
    expect(screen.getByRole("link", { name: "Leans toward Shinto oracles" })).toHaveAttribute("href", "/explore/parallels/leans?text=shinto-oracles");
    expect(screen.getByRole("link", { name: "Pairs with Oracle 15" })).toHaveAttribute("href", "/explore/parallels/shinto-oracles/15");
  });

  it("adds the page to the trail", () => {
    render(<ParallelsPage kind="paragraph" paragraph={paragraph as never} />);
    expect(screen.getByRole("navigation", { name: "Your path" }).textContent).toContain("131:7.2");
  });
});

describe("Parallels passage view", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("shows the passage, its translator, and its closest paragraphs", () => {
    const passage = {
      slug: "shinto-oracles", reference: "Oracle 15", passageRef: "Oracle 15", title: "Shinto Oracles",
      religion: "Shinto", translator: "W. G. Aston", year: 1905, divisionTitle: "Oracle of Itsukushima in Aki",
      sourceUrl: null, text: "Of old the people of my country knew not my name.",
      urantiaParallels: [{ id: "4:131.7.2", standardReferenceId: "131:7.2", paperId: "131", paperTitle: "The World's Religions", sectionTitle: null, text: "Says the Lord.", similarity: 0.67, rank: 1 }],
    };
    render(<ParallelsPage kind="passage" passage={passage} path="/explore/parallels/shinto-oracles/15" />);
    expect(screen.getByRole("heading", { name: /Oracle 15/ })).toBeInTheDocument();
    expect(screen.getByText("Tr. W. G. Aston, 1905 · public domain")).toBeInTheDocument();
    expect(screen.getByText("131:7.2").closest("a")).toHaveAttribute("href", "/explore/parallels/131:7.2");
  });
});

describe("Parallels getServerSideProps", () => {
  const ctx = (path: string[]) => ({ params: { path }, res: { setHeader: vi.fn() } }) as never;

  it("returns 404 for a path that is not a paragraph or a passage", async () => {
    expect(await getServerSideProps(ctx(["nope"]))).toEqual({ notFound: true });
    expect(await getServerSideProps(ctx(["a", "b", "c"]))).toEqual({ notFound: true });
  });

  it("returns 404 when the API does not know the ref", async () => {
    vi.mocked(fetchPassageWithParallels).mockRejectedValueOnce(new NotFoundError("x"));
    expect(await getServerSideProps(ctx(["dhammapada", "999"]))).toEqual({ notFound: true });
  });

  it("caches a found page for a day", async () => {
    vi.mocked(fetchParagraphWithParallels).mockResolvedValueOnce(paragraph as never);
    const c = ctx(["131:7.2"]);
    const result = await getServerSideProps(c);
    expect(result).toEqual({ props: { kind: "paragraph", paragraph } });
    expect((c as { res: { setHeader: ReturnType<typeof vi.fn> } }).res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      expect.stringContaining("s-maxage=86400"),
    );
  });

  it("lets other API errors fail the request", async () => {
    vi.mocked(fetchParagraphWithParallels).mockRejectedValueOnce(new Error("500"));
    await expect(getServerSideProps(ctx(["131:7.2"]))).rejects.toThrow("500");
  });
});
