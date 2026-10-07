import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RelatedWorks from "@/components/RelatedWorks";
import type { ApiScriptureParallel } from "@/libs/urantiaApi/types";

const corpus = (id: string, title: string, religion: string) => ({
  id,
  slug: id,
  religion,
  title,
  translator: "A. Translator",
  year: 1900,
  refPrefix: "X",
  urantiaSection: null,
});

const passage = (
  c: ReturnType<typeof corpus>,
  reference: string,
  similarity: number,
  rank: number
): ApiScriptureParallel => ({
  chunkId: `${c.id}:${reference}`,
  reference,
  corpus: c,
  text: `Text of ${reference}`,
  similarity,
  rank,
  source: "semantic",
  embeddingModel: "text-embedding-3-large",
});

const oracles = corpus("oracles", "Shinto Oracles", "Shinto");
const japji = corpus("japji", "The Japji", "Sikhism");
const parallels = [
  passage(japji, "Japji 0", 0.61, 1),
  passage(japji, "Japji 2", 0.5, 2),
  passage(oracles, "Oracle 15", 0.67, 1),
  passage(oracles, "Oracle 3", 0.49, 2),
  passage(oracles, "Oracle 9", 0.45, 3),
];

const open = () => {
  render(
    <RelatedWorks
      urantiaParallels={[]}
      bibleParallels={[]}
      scriptureParallels={parallels}
      loading={false}
      error=""
    />
  );
  fireEvent.click(screen.getByRole("button", { name: /World religions/ }));
};

describe("RelatedWorks, World religions tab", () => {
  it("counts the texts, not the passages, on the tab", () => {
    open();
    expect(screen.getByRole("button", { name: /World religions/ }).textContent).toContain("· 2");
  });

  it("shows each text's best passage, with the closest text first", () => {
    open();
    const refs = screen.getAllByText(/^(Oracle|Japji) \d+$/).map((el) => el.textContent);
    expect(refs).toEqual(["Oracle 15", "Japji 0"]);
    expect(screen.getAllByText("Tr. A. Translator, 1900")).toHaveLength(2);
  });

  it("opens the other passages of one text on request", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "2 more from Shinto Oracles" }));
    const refs = screen.getAllByText(/^(Oracle|Japji) \d+$/).map((el) => el.textContent);
    expect(refs).toEqual(["Oracle 15", "Oracle 3", "Oracle 9", "Japji 0"]);
    fireEvent.click(screen.getByRole("button", { name: "Show fewer" }));
    expect(screen.queryByText("Oracle 3")).toBeNull();
  });

  it("says when there are no passages", () => {
    render(
      <RelatedWorks urantiaParallels={[]} bibleParallels={[]} loading={false} error="" />
    );
    fireEvent.click(screen.getByRole("button", { name: /World religions/ }));
    expect(screen.getByText("No passages found.")).toBeInTheDocument();
  });
});
