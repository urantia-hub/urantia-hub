import { NextPage } from "next";
import moment from "moment";
import HeadTag from "@/components/HeadTag";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
      "Added <strong>Community Resources</strong> page with curated links and tools",
    ],
  },
  {
    date: "2025-01-25",
    version: "1.0.2",
    title: "Notifications & Listening",
    features: [
      "Added admin interface for managing Daily Quote emails",
      "Email notification preferences: changelog updates, continue reading reminders, and daily quotes",
      'Added "Listen on Spotify" integration for audio playback',
      'Added "Copy Text" buttons to paper pages for easy sharing',
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
      "Enhanced <strong>/search</strong> page with search tips, recent searches, and popular searches",
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

const Changelog: NextPage = () => {
  const renderChangeList = (items: string[] | undefined, label: string) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="mb-4 last:mb-0">
        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
          {label}
        </h4>
        <ul className="space-y-2 ml-2">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-gray-600 dark:text-gray-300"
            >
              <span className="w-1.5 h-1.5 bg-sky-500 rounded-full flex-shrink-0 mt-2" />
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-gray-700 dark:bg-neutral-800 dark:text-white">
      <HeadTag
        titlePrefix="Releases"
        metaDescription="Stay up to date with the latest features, improvements, and updates to UrantiaHub"
      />

      <Navbar />

      <main className="mt-8 flex-grow container mx-auto px-4 my-4 max-w-4xl min-h-screen">
        <div className="mt-4 mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4">Releases</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Stay up to date with new features, improvements, and updates
          </p>
          <div className="flex justify-center gap-4 text-sm">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/changelog.xml"
              className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline"
            >
              RSS Feed
            </a>
          </div>
        </div>

        <div className="space-y-8">
          {releases.map((release) => (
            <article
              key={release.version}
              className="bg-white dark:bg-neutral-700 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6"
            >
              <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                    {release.title}
                  </h2>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200">
                      v{release.version}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {moment(release.date).format("MMMM D, YYYY")}
                    </span>
                  </div>
                </div>
              </div>
              
              {release.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-base">
                  {release.description}
                </p>
              )}

              <div className="space-y-4">
                {renderChangeList(release.features, "New features")}
                {renderChangeList(release.improvements, "Improvements")}
                {renderChangeList(release.fixes, "Bug fixes")}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 mb-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            For older release history, please contact{" "}
            <a
              href="mailto:team@urantiahub.com"
              className="text-sky-600 dark:text-sky-400 hover:underline"
            >
              team@urantiahub.com
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Changelog;
