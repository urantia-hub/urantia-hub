import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Marks anything routed through next/link so the two branches are telling apart.
vi.mock("next/link", () => {
  const MockLink = React.forwardRef(
    ({ children, ...props }: any, ref: any) =>
      React.createElement(
        "a",
        { ...props, ref, "data-next-link": "true" },
        children
      )
  );
  MockLink.displayName = "MockLink";
  return { default: MockLink };
});

import TiltButton from "@/components/TiltButton";

describe("TiltButton", () => {
  it("renders a plain anchor for API hrefs so the browser follows the redirect", () => {
    render(<TiltButton href="/api/redirect/user/read">Read</TiltButton>);

    const link = screen.getByText("Read");
    expect(link).toHaveAttribute("href", "/api/redirect/user/read");
    expect(link).not.toHaveAttribute("data-next-link");
  });

  it("routes page hrefs through next/link", () => {
    render(<TiltButton href="/auth/sign-in">Start Reading</TiltButton>);

    const link = screen.getByText("Start Reading");
    expect(link).toHaveAttribute("href", "/auth/sign-in");
    expect(link).toHaveAttribute("data-next-link", "true");
  });
});
