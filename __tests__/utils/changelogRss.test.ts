import { describe, it, expect } from "vitest";
import {
  escapeXml,
  generateRss,
  releases,
  type ReleaseEntry,
} from "@/utils/changelogRss";

const parse = (xml: string) => new DOMParser().parseFromString(xml, "application/xml");

describe("escapeXml", () => {
  it("escapes the five XML special characters", () => {
    expect(escapeXml(`a & b < c > d "e" 'f'`)).toBe(
      "a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;"
    );
  });
});

describe("generateRss", () => {
  it("produces well-formed XML for the real releases", () => {
    const doc = parse(generateRss());
    expect(doc.getElementsByTagName("parsererror")).toHaveLength(0);
  });

  it("escapes ampersands in item titles", () => {
    const xml = generateRss();
    expect(xml).toContain("<title>v1.1.0: Search, Security &amp; Performance</title>");
    expect(xml).toContain("<title>v1.0.3: Community &amp; Resources</title>");
    const titles = Array.from(parse(xml).getElementsByTagName("title")).map(
      (t) => t.textContent
    );
    expect(titles).toContain("v1.1.0: Search, Security & Performance");
    expect(releases.length + 1).toBe(titles.length);
  });

  it("stays well-formed with hostile content", () => {
    const hostile: ReleaseEntry = {
      date: "2026-01-01",
      version: "9.9.9",
      title: `<b>Q&A</b> <script> "x" ]]>`,
      description: "R&D ]]> <end>",
      features: ["Tom & Jerry ]]> <>"],
      improvements: ["a < b && c > d"],
      fixes: ["&amp; stays literal"],
    };
    const doc = parse(generateRss([hostile], new Date("2026-01-02T00:00:00Z")));
    expect(doc.getElementsByTagName("parsererror")).toHaveLength(0);
    const item = doc.getElementsByTagName("item")[0];
    expect(item.getElementsByTagName("title")[0].textContent).toBe(
      `v9.9.9: Q&A  "x" ]]>`
    );
    const description = item.getElementsByTagName("description")[0].textContent;
    expect(description).toContain("R&amp;D ]]&gt;");
    expect(description).toContain("&amp;amp; stays literal");
  });
});
