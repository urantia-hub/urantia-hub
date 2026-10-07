import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const router = { query: {} as Record<string, string>, push: vi.fn() };
vi.mock("next/router", () => ({ useRouter: () => router }));
vi.mock("@/components/Navbar", () => ({ default: () => React.createElement("nav") }));
vi.mock("@/components/Footer", () => ({ default: () => React.createElement("footer") }));
vi.mock("@/components/HeadTag", () => ({ default: () => null }));
vi.mock("@/libs/analytics", () => ({ track: vi.fn() }));
vi.mock("@/libs/urantiaApi/parallels", () => ({ searchParallels: vi.fn(), fetchCorpora: vi.fn(), fetchParagraphWithParallels: vi.fn() }));

import ParallelsHome from "@/pages/explore/parallels";
import { searchParallels } from "@/libs/urantiaApi/parallels";

const dhp = { id: "d", slug: "dhammapada", religion: "Buddhism", title: "The Dhammapada", translator: "F. Max Muller", year: 1881, refPrefix: "Dhp", urantiaSection: "131:3", sourceUrl: "https://example.org", license: "PD", passageCount: 414, refLevels: 1, notes: null };
const featured = [{ ref: "2:1.2", paperTitle: "The Nature of God", text: "There is but one God", closest: { reference: "Japji 0", religion: "Sikhism" } }];

describe("Parallels start page", () => {
  beforeEach(() => {
    router.query = {};
    vi.mocked(searchParallels).mockReset();
  });

  it("starts with the box, paragraphs from across the book, and the texts", () => {
    render(<ParallelsHome corpora={[dhp]} featured={featured} />);
    expect(screen.getByLabelText(/Search by meaning/)).toBeInTheDocument();
    expect(screen.getByText("2:1.2").closest("a")).toHaveAttribute("href", "/explore/parallels/2:1.2");
    expect(screen.getByText("Japji 0")).toBeInTheDocument();
    expect(screen.getByText("The Dhammapada")).toBeInTheDocument();
  });

  it("searches by meaning when the URL has q, and links each passage", async () => {
    router.query = { q: "hatred" };
    vi.mocked(searchParallels).mockResolvedValue({
      paragraphs: [{ id: "4:140.3.15", standardReferenceId: "140:3.15", paperId: "140", paperTitle: "The Ordination of the Twelve", sectionTitle: null, text: "Love your enemies", similarity: 0.5, rank: 1 }],
      passages: [{ chunkId: "d:3", reference: "Dhp 3-5", corpus: dhp, text: "hatred ceases by love", similarity: 0.6, rank: 1, source: "s", embeddingModel: "m" }],
    });
    render(<ParallelsHome corpora={[dhp]} featured={featured} />);
    await waitFor(() => expect(screen.getByText("140:3.15")).toBeInTheDocument());
    expect(searchParallels).toHaveBeenCalledWith("hatred");
    expect(screen.getByText("Dhp 3-5").closest("a")).toHaveAttribute("href", "/explore/parallels/dhammapada/3");
    expect(screen.queryByText("Start anywhere")).toBeNull();
  });

  it("says so when the search fails", async () => {
    router.query = { q: "hatred" };
    vi.mocked(searchParallels).mockRejectedValue(new Error("down"));
    render(<ParallelsHome corpora={[dhp]} featured={featured} />);
    await waitFor(() => expect(screen.getByText(/did not complete/)).toBeInTheDocument());
  });
});
