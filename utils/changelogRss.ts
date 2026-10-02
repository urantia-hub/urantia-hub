import moment from "moment";

export interface ReleaseEntry {
  date: string;
  version: string;
  title: string;
  description?: string;
  features?: string[];
  improvements?: string[];
  fixes?: string[];
}

export const releases: ReleaseEntry[] = [
  {
    date: "2026-10-02",
    version: "1.1.0",
    title: "Search, Security & Performance",
    description: "Major improvements to discoverability, security, and user experience",
    features: [
      "Enhanced search engine crawlability with JSON-LD structured data",
      "Progressive Web App (PWA) support with standalone display mode",
      "Improved navigation and site structure for better discoverability",
    ],
    improvements: [
      "Upgraded to Next.js 15 for improved performance and stability",
      "Enhanced security with Sentry error tracking and monitoring",
      "Optimized email delivery system with Resend integration",
      "Improved SEO with accurate paper counts and metadata",
      "Better mobile app experience when installed as PWA",
    ],
    fixes: [
      "Fixed dark theme persistence across browser sessions",
      "Resolved email notification delivery issues",
      "Corrected paper count display throughout the site",
    ],
  },
  {
    date: "2025-05-16",
    version: "1.0.3",
    title: "Community & Resources",
    features: [
      "Added Community Resources page with curated links and tools",
    ],
  },
  {
    date: "2025-01-25",
    version: "1.0.2",
    title: "Notifications & Listening",
    features: [
      "Added admin interface for managing Daily Quote emails",
      "Email notification preferences: changelog updates, continue reading reminders, and daily quotes",
      "Added \"Listen on Spotify\" integration for audio playback",
      "Added \"Copy Text\" buttons to paper pages for easy sharing",
    ],
    improvements: [
      "Updated Explore page to show Papers by Topic and Most Read papers",
    ],
    fixes: [
      "Resolved dark theme persistence issue across browser sessions",
    ],
  },
  {
    date: "2025-01-18",
    version: "1.0.1",
    title: "Search & Archives",
    features: [
      "Added Blockchain Archive page for permanent content preservation",
      "Added Latest Updates page to track new features",
      "Enhanced /search page with search tips, recent searches, and popular searches",
    ],
    improvements: [
      "Updated copy-paste formatting for better text selection on paper pages",
    ],
  },
  {
    date: "2025-01-18",
    version: "1.0.0",
    title: "Launch",
    description: "Modern reading experience for the Urantia Papers",
    features: [
      "Beautiful, modern reading interface with audio playback",
      "AI-powered explanations for complex passages",
      "Reading progress tracking across all papers",
      "Note-taking and bookmarking system with categories",
      "Dark mode for comfortable reading",
    ],
  },
];

const SITE_URL = "https://www.urantiahub.com";

/** Escapes text for use in an XML text node or as HTML text inside CDATA. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Wraps a string in CDATA, splitting any literal `]]>` so it cannot end the section early. */
export function toCdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

function renderList(heading: string, entries?: string[]): string {
  if (!entries || entries.length === 0) return "";
  const items = entries.map((entry) => `<li>${escapeXml(entry)}</li>`).join("");
  return `<h3>${heading}</h3><ul>${items}</ul>`;
}

export function generateRssItem(release: ReleaseEntry): string {
  const content =
    (release.description ? `<p>${escapeXml(release.description)}</p>` : "") +
    renderList("New Features", release.features) +
    renderList("Improvements", release.improvements) +
    renderList("Bug Fixes", release.fixes);

  const title = escapeXml(`v${release.version}: ${stripHtml(release.title)}`);
  const version = encodeURIComponent(`v${release.version}`);

  return `
    <item>
      <title>${title}</title>
      <link>${SITE_URL}/changelog</link>
      <guid>${SITE_URL}/changelog#${version}</guid>
      <pubDate>${moment(release.date).toDate().toUTCString()}</pubDate>
      <description>${toCdata(content)}</description>
    </item>`;
}

export function generateRss(
  entries: ReleaseEntry[] = releases,
  now: Date = new Date()
): string {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>UrantiaHub Releases</title>
    <link>${SITE_URL}/changelog</link>
    <description>Stay up to date with new features, improvements, and updates to UrantiaHub</description>
    <language>en</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/changelog.xml" rel="self" type="application/rss+xml" />
    ${entries.map(generateRssItem).join("\n")}
  </channel>
</rss>`;
}
