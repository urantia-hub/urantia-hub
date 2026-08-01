import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "unauthenticated" }),
}));

vi.mock("@/components/Navbar", () => ({
  default: () => React.createElement("nav", { "data-testid": "navbar" }),
}));

vi.mock("@/components/Footer", () => ({
  default: () => React.createElement("footer", { "data-testid": "footer" }),
}));

vi.mock("@/components/HeadTag", () => ({
  default: () => null,
}));

import ExplorePage from "@/pages/explore";

const nodes = [
  {
    globalId: "1:",
    labels: [],
    partId: "1",
    partTitle: "The Central and Superuniverses",
    type: "part",
  },
  {
    globalId: "1:1",
    labels: ["Theology"],
    paperId: "1",
    paperTitle: "The Universal Father",
    partId: "1",
    type: "paper",
  },
];

describe("Explore page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({ json: () => Promise.resolve({ data: [] }) })
      )
    );
  });

  it("renders the parts preview from the nodes prop", () => {
    render(<ExplorePage nodes={nodes as any} />);

    expect(screen.getByText("Part 1 Papers")).toBeInTheDocument();
  });

  it("renders without crashing when the nodes prop is missing", () => {
    // Next's client router can hand the page empty pageProps (e.g. a transition
    // that resolves here through the /api/redirect/user/read 307).
    expect(() => render(<ExplorePage {...({} as any)} />)).not.toThrow();
  });
});
