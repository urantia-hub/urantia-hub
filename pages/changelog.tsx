import { NextPage } from "next";
import moment from "moment";
import HeadTag from "@/components/HeadTag";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ChangelogEntry {
  date: string;
  version: string;
  changes: string[];
}

const changelog: ChangelogEntry[] = [
  {
    date: "2026-01-15",
    version: "1.1.0",
    changes: [
      "Upgraded to <strong>Next.js 15</strong> for improved performance and stability",
      "Enhanced security with proper HTTP headers (X-Frame-Options, CSP, Referrer-Policy)",
      "Improved error tracking and monitoring with Sentry optimizations",
      "Fixed page crashes on client-side navigation for Papers and Explore pages",
      "Resolved 91 security vulnerabilities through dependency updates",
      "Optimized source map handling for better debugging while protecting code",
    ],
  },
  {
    date: "2025-05-16",
    version: "1.0.3",
    changes: [
      "Added <strong>Community Resources</strong> page: <strong>/community-resources</strong>",
    ],
  },
  {
    date: "2025-01-25",
    version: "1.0.2",
    changes: [
      "Added admin page to manage Daily Quote emails",
      "Added email notification toggle for changelog updates",
      "Added email notification toggle for continue reading updates",
      "Added email notification toggle for daily quote updates",
      'Added "Listen on Spotify" button and "Copy Text" buttons to paper pages',
      "Resolved dark theme persistence issue across browser sessions",
      "Updated Explore page to show Papers by Topic + Most Read papers",
    ],
  },
  {
    date: "2025-01-18",
    version: "1.0.1",
    changes: [
      "Updated copy-paste formatting for text selection on paper pages",
      "Added Blockchain Archive page: <strong>/blockchain-archive</strong>",
      "Added Latest Updates page: <strong>/changelog</strong>",
      "Enhanced <strong>/search</strong> page with search tips, recent searches, and popular searches",
    ],
  },
  {
    date: "2025-01-18",
    version: "1.0.0",
    changes: [
      "Launched modern reading experience with audio playback",
      "Added AI-powered explanations for complex passages",
      "Implemented reading progress tracking",
      "Added note-taking and bookmarking system",
      "Introduced dark mode for comfortable reading",
    ],
  },
];

const Changelog: NextPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-gray-700 dark:bg-neutral-800 dark:text-white">
      <HeadTag
        titlePrefix="Latest Updates"
        metaDescription="Track the latest features and improvements to UrantiaHub"
      />

      <Navbar />

      <main className="mt-8 flex-grow container mx-auto px-4 my-4 max-w-3xl min-h-screen">
        <div className="mt-4 mb-12 text-center">
          <h1 className="text-5xl font-bold mb-8">Latest Updates</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Track the latest features and improvements to UrantiaHub
          </p>
        </div>

        <div className="space-y-8">
          {changelog.map((entry) => (
            <div
              key={entry.version}
              className="bg-white dark:bg-neutral-700 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6"
            >
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-600 dark:text-white">
                  v{entry.version}
                </h2>
                <span className="text-sm text-gray-400">
                  {moment(entry.date).format("MMMM Do, YYYY")}
                </span>
              </div>
              <ul className="space-y-2">
                {entry.changes.map((change, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                  >
                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full flex-shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: change }} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Changelog;
