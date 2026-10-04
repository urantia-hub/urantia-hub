import { describe, expect, it } from "vitest";
import { deriveSignedOutReadButton } from "@/utils/readPaperLink";

describe("deriveSignedOutReadButton", () => {
  it("starts a new reader at the Foreword", () => {
    expect(deriveSignedOutReadButton(null)).toEqual({
      href: "/papers/foreword",
      label: "Start Reading",
    });
  });

  it("returns a reader to the saved place", () => {
    expect(
      deriveSignedOutReadButton({ paperId: "2", globalId: "1:2.5.1" })
    ).toEqual({
      href: "/api/redirect/user/read?paperId=2&globalId=1:2.5.1",
      label: "Continue Reading",
    });
  });

  it("ignores a saved place with a missing field", () => {
    expect(deriveSignedOutReadButton({ paperId: "2" }).href).toBe(
      "/papers/foreword"
    );
  });
});
