// Node modules.
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
// Relative modules.
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeadTag from "@/components/HeadTag";
import { paperLabels } from "@/utils/paperLabels";
import Spinner from "@/components/Spinner";
import { paperIdToUrl } from "@/utils/paperFormatters";

// Define the structure of the data you expect from the API
type TOCNode = {
  globalId: string;
  labels: string[];
  paperId?: string;
  paperTitle?: string;
  partId: string;
  partSponsorship?: string;
  partTitle?: string;
  type: string;
};

type TOCPageProps = {
  nodes?: TOCNode[];
};

// Nodes defaults to [] because a client-side transition can render this page
// with empty pageProps, which used to crash the whole page.
const ReadPage = ({ nodes = [] }: TOCPageProps) => {
  // Hooks.
  const { status } = useSession();

  // State.
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Progress state.
  const [progressResults, setProgressResults] = useState<ProgressResult[]>([]);

  const fetchProgress = async () => {
    try {
      const response = await fetch("/api/user/nodes/progress");
      const data = await response.json();
      setProgressResults(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const onAuthenticated = async () => {
    await fetchProgress();
  };

  useEffect(() => {
    if (status === "authenticated") {
      void onAuthenticated();
    }
  }, [status]);

  // Function to handle filter toggle.
  const toggleFilter = (label: string) => {
    setActiveFilters(
      (currentFilters) =>
        currentFilters.includes(label)
          ? currentFilters.filter((filter) => filter !== label) // Remove filter if it's already active.
          : [...currentFilters, label] // Add filter if it's not active.
    );
  };

  // Function to determine if a paper should be shown based on active filters.
  const shouldShowPaper = (labels: string[]) => {
    // If no filters are active, all papers should be shown.
    if (activeFilters.length === 0) return true;

    // If a paper has no labels, it should not be shown.
    if (!labels) return false;

    // Otherwise, only show papers that match at least one active filter.
    return labels.some((label) => activeFilters.includes(label));
  };

  const highlightActiveFilterLabels = (
    paperLabels: string[],
    activeFilters: string[]
  ) => {
    // Derive the labels that match user interests.
    const matchingLabels = paperLabels.filter((label) =>
      activeFilters.includes(label)
    );

    // Derive the labels that do not match user interests.
    const nonMatchingLabels = paperLabels.filter(
      (label) => !matchingLabels.includes(label)
    );

    // Return the matching labels in bold and the non-matching labels as is.
    return [
      ...matchingLabels.map(
        (label) => `<span class="text-blue-400">${label}</span>`
      ),
      ...nonMatchingLabels,
    ];
  };

  const deriveProgressBadge = (progressResult: ProgressResult | undefined) => {
    return (
      <>
        {/* Progress Bar */}
        {progressResult && progressResult?.progress < 100 && (
          <div className="flex items-center justify-center absolute -top-4 -right-3 h-8 w-8 bg-slate-400 text-white shadow-lg rounded-full dark:bg-neutral-200 dark:text-gray-600 text-xs">
            {progressResult.progress.toFixed(0)}%
          </div>
        )}

        {/* Completed Checkmark */}
        {progressResult && progressResult?.progress === 100 && (
          <div className="flex items-center justify-center absolute -top-4 -right-3 h-8 w-8 bg-green-400 text-white shadow-lg rounded-full dark:bg-green-400 dark:text-white text-xs">
            <svg className="w-4 h-4" viewBox="0 0 20 20">
              <path fill="currentColor" d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
            </svg>
          </div>
        )}
      </>
    );
  };

  // Function to render each part and its papers
  const renderNode = (currentNode: TOCNode) => {
    switch (currentNode.type) {
      case "part": {
        const papers = nodes.filter(
          (node) =>
            currentNode.partId === node.partId &&
            node.type === "paper" &&
            node.paperId !== "0" &&
            shouldShowPaper(node.labels)
        );

        if (!papers.length) return null;

        return (
          <div key={currentNode.globalId} className="mb-8">
            <h2 className="text-xs mb-6 pb-2 text-center border-b text-gray-400 border-gray-200 dark:border-gray-600">
              Part {currentNode.partId}:{" "}
              {currentNode.partTitle || `Part ${currentNode.partId}`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {papers.map((paper) => {
                // Derive progress result for the current paper.
                const progressResult = progressResults.find(
                  (progressResult) => progressResult?.paperId === paper.paperId
                );

                return (
                  <Link
                    className="relative flex flex-col justify-between px-4 py-2 mb-2 bg-white dark:bg-neutral-700 hover:dark:bg-neutral-600 rounded transition-colors hover:no-underline hover:shadow-lg hover:dark:shadow-none transition-shadow duration-300"
                    href={`/papers/${paperIdToUrl(`${paper.paperId}`)}`}
                    key={paper.globalId}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">
                        Paper {paper.paperId}
                      </span>
                      <h3
                        className="mt-1 text-lg font-bold leading-6 text-gray-600 dark:text-white"
                        id={paper.paperId}
                      >
                        {paper.paperTitle}
                      </h3>
                    </div>

                    <div className="flex flex-col">
                      <span
                        className="mt-1 text-xs text-gray-400 truncate w-full"
                        title={paper.labels.sort().join(" | ")}
                        dangerouslySetInnerHTML={{
                          __html: highlightActiveFilterLabels(
                            paper.labels,
                            activeFilters
                          )
                            .sort()
                            .join(" | "),
                        }}
                      />

                      {deriveProgressBadge(progressResult)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      }
      case "paper": {
        // Foreword is a special case; handle it separately.
        if (
          currentNode.paperId === "0" &&
          shouldShowPaper(currentNode.labels)
        ) {
          // Derive progress result for the current paper.
          const progressResult = progressResults.find(
            (progressResult) => progressResult?.paperId === currentNode.paperId
          );

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6">
              <Link
                className="relative block px-4 py-2 bg-white dark:bg-neutral-700 hover:dark:bg-neutral-600 rounded transition-colors hover:no-underline hover:shadow-lg hover:dark:shadow-none transition-shadow duration-300"
                href={`/papers/${paperIdToUrl(`${currentNode.paperId}`)}`}
              >
                <span className="text-xs text-gray-400">Foreword</span>
                <h3 className="text-lg font-bold text-gray-600 dark:text-white">
                  {currentNode.paperTitle}
                </h3>
                <span
                  className="text-xs text-gray-400 truncate"
                  title={currentNode.labels.sort().join(" | ")}
                  dangerouslySetInnerHTML={{
                    __html: highlightActiveFilterLabels(
                      currentNode.labels,
                      activeFilters
                    )
                      .sort()
                      .join(" | "),
                  }}
                />

                {deriveProgressBadge(progressResult)}
              </Link>
            </div>
          );
        }
        break;
      }
      default:
        return null;
    }
  };

  // Extract parts and sort them by partId
  const foreword = nodes.find((node) => node.paperId === "0");
  const sortedNodes = nodes
    .filter((node) => node.type === "part")
    .sort((a, b) => parseInt(a.partId) - parseInt(b.partId));

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-gray-700 dark:bg-neutral-800 dark:text-white">
      <HeadTag
        metaDescription="Find the Urantia Papers that resonate with you on UrantiaHub. With 197 papers, there is a wealth of wisdom to explore."
        titlePrefix="Papers"
        canonicalUrl="https://www.urantiahub.com/papers"
      />

      <Navbar />

      <main className="mt-8 flex-grow container mx-auto px-4 my-4 max-w-4xl">
        {status === "loading" ? (
          <div className="mt-4 mb-4 text-center">
            <h1 className="text-5xl font-bold mb-8">The Urantia Papers</h1>
            <Spinner />
          </div>
        ) : (
          <>
            <div className="mt-4 mb-4 text-center">
              <h1 className="text-5xl font-bold mb-8">The Urantia Papers</h1>

              {/* -- All Papers --- */}
              <h2 className="text-base pb-2 text-center border-b text-gray-400 border-gray-200 dark:border-gray-600">
                All Papers
              </h2>

              {/* Render filter toggle buttons */}
              {showFilters ? (
                <>
                  <button
                    className="px-3 py-1 rounded text-sm md:text-xs font-semibold bg-white text-gray-600 dark:bg-neutral-600 dark:text-neutral-300 border-0 mt-4 shadow-lg"
                    onClick={() => {
                      setShowFilters(false);
                      setActiveFilters([]);
                    }}
                  >
                    Hide Filters
                  </button>
                  <div className="flex flex-wrap gap-2 mt-4 mb-4">
                    {paperLabels.map((label) => (
                      <button
                        aria-label={`Filter by ${label}`}
                        key={label}
                        className={`px-3 py-1 rounded text-sm md:text-xs font-semibold ${
                          activeFilters.includes(label)
                            ? "bg-blue-400 text-white dark:bg-blue-600 dark:text-white"
                            : "bg-white text-gray-400 dark:bg-neutral-600 dark:text-neutral-300"
                        } border-0 hover:shadow-lg transition-shadow duration-300`}
                        onClick={() => toggleFilter(label)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex justify-center mt-4">
                  <button
                    className="px-3 py-1 rounded text-sm md:text-xs font-semibold bg-white text-gray-400 dark:bg-neutral-600 dark:text-neutral-300 border-0 shadow-lg"
                    onClick={() => setShowFilters(true)}
                  >
                    Filter by Topics
                  </button>
                </div>
              )}
            </div>

            {/* Render parts and papers */}
            {foreword && renderNode(foreword)}
            {sortedNodes.map((node) => renderNode(node))}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export async function getStaticProps() {
  const { fetchToc } = await import("@/libs/urantiaApi/client");
  let nodes: any[] = [];
  try {
    nodes = await fetchToc();
  } catch (error) {
    console.error("[getStaticProps] Failed to fetch TOC:", error);
  }

  return {
    props: {
      nodes,
    },
    revalidate: 60,
  };
}

export default ReadPage;
