import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/components/Navbar", () => ({ default: () => React.createElement("nav") }));
vi.mock("@/components/Footer", () => ({ default: () => React.createElement("footer") }));
vi.mock("@/components/HeadTag", () => ({ default: () => null }));
vi.mock("@/libs/urantiaApi/parallels", () => ({
  fetchSharedCurrents: vi.fn(),
  fetchFarFromTexts: vi.fn(),
  fetchMutualPairs: vi.fn(),
  fetchLeans: vi.fn(),
  fetchCorpora: vi.fn(),
}));

import SharedCurrents, { getServerSideProps as currentsProps } from "@/pages/explore/parallels/currents";
import FarFromTexts, { getServerSideProps as farProps } from "@/pages/explore/parallels/far";
import Pairs, { getServerSideProps as pairsProps } from "@/pages/explore/parallels/pairs";
import Leans, { getServerSideProps as leansProps } from "@/pages/explore/parallels/leans";
import { fetchCorpora, fetchFarFromTexts, fetchLeans, fetchMutualPairs, fetchSharedCurrents } from "@/libs/urantiaApi/parallels";

const corpus = { id: "q", slug: "quran", religion: "Islam", title: "The Meaning of the Glorious Koran", translator: "Marmaduke Pickthall", year: 1930, refPrefix: "Quran", urantiaSection: null };
const paragraph = { id: "4:122.2.3", standardReferenceId: "122:2.3", paperId: "122", paperTitle: "Birth and Infancy of Jesus", sectionTitle: null, text: "Zacharias prayed." };
const meta = (total: number) => ({ page: 0, limit: 20, total, totalPages: Math.ceil(total / 20) });
const ctx = (query: Record<string, string>) => ({ query, res: { setHeader: vi.fn() } }) as never;

beforeEach(() => {
  window.sessionStorage.clear();
  vi.mocked(fetchCorpora).mockResolvedValue([corpus] as never);
});

describe("insight list pages", () => {
  it("shared currents shows the count and closest texts, with part filters", () => {
    const result = { data: [{ paragraph, textsClose: 9, consensus: 0.95, distance: 0.01, closest: [{ corpus, percentile: 0.99 }] }], meta: meta(1) };
    render(<SharedCurrents result={result} part="" />);
    expect(screen.getByText(/9 of 10/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Part IV" })).toHaveAttribute("href", "/explore/parallels/currents?part=4");
    expect(screen.getByText(/does not say that two teachings are the same/)).toBeInTheDocument();
  });

  it("pairs shows both sides and links the passage page", () => {
    const result = { data: [{ paragraph, corpus, passage: { chunkId: "q:Quran 3.38", reference: "Quran 3.38-39", text: "Then Zachariah prayed" }, similarity: 0.68, similaritySmall: 0.69 }], meta: meta(1) };
    render(<Pairs result={result} text="" texts={[{ slug: "quran", label: "Quran" }]} />);
    expect(screen.getByText("Quran 3.38-39").closest("a")).toHaveAttribute("href", "/explore/parallels/quran/3.38");
    expect(screen.getByText("122:2.3").closest("a")).toHaveAttribute("href", "/explore/parallels/122:2.3");
    expect(screen.getByRole("link", { name: "World religions" })).toHaveAttribute("aria-current", "page");
  });

  it("leans and far render their lines, and an empty list says so", () => {
    render(<Leans result={{ data: [{ paragraph, corpus, gap: 0.31, percentile: 0.97 }], meta: meta(1) }} text="quran" texts={[{ slug: "quran", label: "Quran" }]} />);
    expect(screen.getByText(/31 points above/)).toBeInTheDocument();
    render(<FarFromTexts result={{ data: [], meta: meta(0) }} part="1" />);
    expect(screen.getByText("Nothing to show for this choice.")).toBeInTheDocument();
  });
});

describe("insight list getServerSideProps", () => {
  it("reads only valid filters and pages", async () => {
    vi.mocked(fetchSharedCurrents).mockResolvedValue({ data: [], meta: meta(0) } as never);
    await currentsProps(ctx({ part: "9", page: "-3" }));
    expect(fetchSharedCurrents).toHaveBeenCalledWith({ partId: undefined, page: 0, limit: 20 });
  });

  it("far starts with Part I, and 'all' clears the part", async () => {
    vi.mocked(fetchFarFromTexts).mockResolvedValue({ data: [], meta: meta(0) } as never);
    await farProps(ctx({}));
    expect(fetchFarFromTexts).toHaveBeenLastCalledWith({ partId: "1", page: 0, limit: 20 });
    await farProps(ctx({ part: "all" }));
    expect(fetchFarFromTexts).toHaveBeenLastCalledWith({ partId: undefined, page: 0, limit: 20 });
  });

  it("pairs leave out the Bible by default and accept a known text only", async () => {
    vi.mocked(fetchMutualPairs).mockResolvedValue({ data: [], meta: meta(0) } as never);
    await pairsProps(ctx({}));
    expect(fetchMutualPairs).toHaveBeenLastCalledWith({ excludeBible: "true", page: 0, limit: 20 });
    await pairsProps(ctx({ text: "bible" }));
    expect(fetchMutualPairs).toHaveBeenLastCalledWith({ corpus: "bible", page: 0, limit: 20 });
    await pairsProps(ctx({ text: "nope" }));
    expect(fetchMutualPairs).toHaveBeenLastCalledWith({ excludeBible: "true", page: 0, limit: 20 });
  });

  it("leans filter by a known text", async () => {
    vi.mocked(fetchLeans).mockResolvedValue({ data: [], meta: meta(0) } as never);
    await leansProps(ctx({ text: "quran", page: "2" }));
    expect(fetchLeans).toHaveBeenLastCalledWith({ corpus: "quran", page: 2, limit: 20 });
  });
});
