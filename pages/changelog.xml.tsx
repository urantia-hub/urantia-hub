import { GetServerSideProps } from "next";
import moment from "moment";

interface ReleaseEntry {
  date: string;
  version: string;
  title: string;
  description?: string;
  features?: string[];
  improvements?: string[];
  fixes?: string[];
}

const releases: ReleaseEntry[] = [
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

function generateRssItem(release: ReleaseEntry): string {
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");
  
  let content = "";
  
  if (release.description) {
    content += `<p>${release.description}</p>`;
  }
  
  if (release.features && release.features.length > 0) {
    content += `<h3>New Features</h3><ul>`;
    release.features.forEach((feature) => {
      content += `<li>${feature}</li>`;
    });
    content += `</ul>`;
  }
  
  if (release.improvements && release.improvements.length > 0) {
    content += `<h3>Improvements</h3><ul>`;
    release.improvements.forEach((improvement) => {
      content += `<li>${improvement}</li>`;
    });
    content += `</ul>`;
  }
  
  if (release.fixes && release.fixes.length > 0) {
    content += `<h3>Bug Fixes</h3><ul>`;
    release.fixes.forEach((fix) => {
      content += `<li>${fix}</li>`;
    });
    content += `</ul>`;
  }

  return `
    <item>
      <title>v${release.version}: ${stripHtml(release.title)}</title>
      <link>https://www.urantiahub.com/changelog</link>
      <guid>https://www.urantiahub.com/changelog#v${release.version}</guid>
      <pubDate>${moment(release.date).toDate().toUTCString()}</pubDate>
      <description><![CDATA[${content}]]></description>
    </item>`;
}

function generateRss(): string {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>UrantiaHub Releases</title>
    <link>https://www.urantiahub.com/changelog</link>
    <description>Stay up to date with new features, improvements, and updates to UrantiaHub</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://www.urantiahub.com/changelog.xml" rel="self" type="application/rss+xml" />
    ${releases.map(generateRssItem).join("\n")}
  </channel>
</rss>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.write(generateRss());
  res.end();

  return {
    props: {},
  };
};

const ChangelogRss = () => {
  return null;
};

export default ChangelogRss;
