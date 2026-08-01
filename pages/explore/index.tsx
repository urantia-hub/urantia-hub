// Node modules.
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
// Relative modules.
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeadTag from "@/components/HeadTag";
import Spinner from "@/components/Spinner";
import { paperIdToUrl } from "@/utils/paperFormatters";
import { getPaperIdFromGlobalId } from "@/utils/node";

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

type CuratedQuote = {
  createdAt: string;
  globalId: string;
  paperId: string;
  sentAt: string;
  paper: {
    title: string;
  };
  paragraphNode: {
    htmlText: string;
    labels: string[];
    paperTitle: string;
    partId: string;
    sectionTitle: string;
    standardReferenceId: string;
    text: string;
  };
};

type TOCPageProps = {
  nodes?: TOCNode[];
};

// Nodes defaults to [] because a client-side transition can render this page
// with empty pageProps, which used to crash the whole page.
const ReadPage = ({ nodes = [] }: TOCPageProps) => {
  // Hooks.
  const { status } = useSession();

  // Papers in progress.
  const [papersInProgress, setPapersInProgress] = useState<TOCNode[]>([]);
  const [progressResults, setProgressResults] = useState<ProgressResult[]>([]);

  // User interests state.
  const [userInterests, setUserInterests] = useState<any[]>([]);

  // Featured quotes.
  const [featuredQuotes, setFeaturedQuotes] = useState<CuratedQuote[]>([]);

  // Most read papers.
  const [mostReadPapers, setMostReadPapers] = useState<TOCNode[]>([]);

  // Papers by topic.
  const [sciencePapers, setSciencePapers] = useState<TOCNode[]>([]);
  const [anthropologyPapers, setAnthropologyPapers] = useState<TOCNode[]>([]);
  const [afterLifePapers, setAfterLifePapers] = useState<TOCNode[]>([]);

  // Loading states.
  const [fetchingAfterLife, setFetchingAfterLife] = useState<boolean>(false);
  const [fetchingAnthropology, setFetchingAnthropology] =
    useState<boolean>(false);
  const [fetchingFeaturedQuotes, setFetchingFeaturedQuotes] =
    useState<boolean>(false);
  const [fetchingMostRead, setFetchingMostRead] = useState<boolean>(false);
  const [fetchingProgress, setFetchingProgress] = useState<boolean>(false);
  const [fetchingScience, setFetchingScience] = useState<boolean>(false);

  useEffect(() => {
    if (userInterests.length > 0) {
      setPapersInProgress([
        ...getInProgressPapersForUser(nodes, progressResults),
      ]);
    }
  }, [userInterests, nodes, progressResults]);

  const fetchProgress = async () => {
    try {
      setFetchingProgress(true);
      const response = await fetch("/api/user/nodes/progress");
      const data = await response.json();
      setProgressResults(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingProgress(false);
    }
  };

  const fetchFeaturedQuotes = async () => {
    try {
      setFetchingFeaturedQuotes(true);
      const response = await fetch(
        "/api/explore/curated-quotes?sent=true&randomAmount=2"
      );
      const data = await response.json();
      setFeaturedQuotes(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingFeaturedQuotes(false);
    }
  };

  const fetchMostReadPapers = async () => {
    try {
      setFetchingMostRead(true);
      const response = await fetch("/api/explore/most-read");
      const data = await response.json();
      const readPapers = nodes.filter((node) =>
        data?.data?.topPaperIds?.includes(node.paperId)
      );
      setMostReadPapers(readPapers);
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingMostRead(false);
    }
  };

  const fetchSciencePapers = async () => {
    try {
      setFetchingScience(true);
      const response = await fetch(
        "/api/explore/papers-by-topic?topic=Science"
      );
      const data = await response.json();
      const papers = nodes.filter((node) =>
        data.data.some(
          (readNode: any) =>
            getPaperIdFromGlobalId(readNode.globalId) === node.paperId
        )
      );
      setSciencePapers(papers);
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingScience(false);
    }
  };

  const fetchAnthropologyPapers = async () => {
    try {
      setFetchingAnthropology(true);
      const response = await fetch(
        "/api/explore/papers-by-topic?topic=Anthropology"
      );
      const data = await response.json();
      const papers = nodes.filter((node) =>
        data.data.some(
          (readNode: any) =>
            getPaperIdFromGlobalId(readNode.globalId) === node.paperId
        )
      );
      setAnthropologyPapers(papers);
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingAnthropology(false);
    }
  };

  const fetchAfterLifePapers = async () => {
    try {
      setFetchingAfterLife(true);
      const response = await fetch(
        "/api/explore/papers-by-topic?topic=After Life"
      );
      const data = await response.json();
      const papers = nodes.filter((node) =>
        data.data.some(
          (readNode: any) =>
            getPaperIdFromGlobalId(readNode.globalId) === node.paperId
        )
      );
      setAfterLifePapers(papers);
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingAfterLife(false);
    }
  };

  const onAuthenticated = async () => {
    await Promise.all([
      fetchProgress(),
      fetchFeaturedQuotes(),
      fetchMostReadPapers(),
      fetchSciencePapers(),
      fetchAnthropologyPapers(),
      fetchAfterLifePapers(),
    ]);
  };

  useEffect(() => {
    if (status === "authenticated") {
      void onAuthenticated();
    }
  }, [status]);

  const getInProgressPapersForUser = (
    allPapers: TOCNode[],
    progressResults: ProgressResult[],
    maxPapers: number = 3
  ): TOCNode[] => {
    const paperIds = progressResults
      .filter(
        (progressResult) =>
          progressResult?.progress < 100 && progressResult?.progress > 0
      )
      .filter((progressResult) => {
        return allPapers.some(
          (paper) => paper.paperId === progressResult?.paperId
        );
      })
      .map((progressResult) => progressResult?.paperId);

    const papersInProgress = allPapers.filter((paper) =>
      paperIds.includes(paper?.paperId as string)
    );

    return papersInProgress
      .sort(() => 0.5 - Math.random())
      .slice(0, maxPapers)
      .sort((a, b) => {
        if (a.paperId && b.paperId) {
          return parseInt(a.paperId) - parseInt(b.paperId);
        }
        return 0;
      });
  };

  const highlightUserInterestLabels = (
    paperLabels: string[],
    userInterests: any[]
  ) => {
    // Derive the labels that match user interests.
    const matchingLabels = paperLabels.filter((label) =>
      userInterests.some((userInterest) => userInterest.label.name === label)
    );

    // Derive the labels that do not match user interests.
    const nonMatchingLabels = paperLabels.filter(
      (label) => !matchingLabels.includes(label)
    );

    // Return the matching labels in bold and the non-matching labels as is.
    return [
      ...matchingLabels.map((label) => `<span class="">${label}</span>`),
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-gray-700 dark:bg-neutral-800 dark:text-white">
      <HeadTag
        metaDescription="Explore the rich tapestry of wisdom within The Urantia Papers on UrantiaHub, discovering insights and teachings that resonate with you."
        titlePrefix="Explore"
        canonicalUrl="https://www.urantiahub.com/explore"
      />

      <Navbar />

      <main className="mt-8 flex-grow container mx-auto px-4 my-4 max-w-4xl min-h-screen">
        {status === "loading" ? (
          <div className="mt-4 mb-4 text-center">
            <h1 className="text-5xl font-bold mb-8">Explore</h1>
            <Spinner />
          </div>
        ) : (
          <>
            <div className="mt-4 mb-4 text-center">
              <h1 className="text-5xl font-bold mb-8">Explore</h1>

              {/* Featured Passages */}
              {!fetchingFeaturedQuotes && featuredQuotes?.length ? (
                <div className="mb-8 fade-in">
                  <h2 className="text-base mb-2 pb-2 text-center border-b text-gray-400 border-gray-200 dark:border-gray-600">
                    Featured Passages
                  </h2>

                  <p className="text-xs text-gray-400 mb-6">
                    Discover the context behind some of the most inspiring
                    passages.
                  </p>

                  {fetchingFeaturedQuotes ? (
                    <div className="flex justify-center items-center fade-in">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 fade-in">
                      {featuredQuotes?.map((quote) => {
                        const cleanHtml = quote.paragraphNode.htmlText.replace(
                          /\sclass="[^"]*"/g,
                          ""
                        );

                        return (
                          <Link
                            key={quote.globalId}
                            href={`/papers/${paperIdToUrl(
                              `${quote.paperId}`
                            )}#${quote.globalId}`}
                            className="relative flex flex-col items-start text-left px-6 pt-5 pb-10 bg-white dark:bg-neutral-700 hover:dark:bg-neutral-600 rounded transition-colors hover:no-underline hover:shadow-lg hover:dark:shadow-none transition-shadow duration-300"
                          >
                            {/* Paper Info */}
                            <div className="flex flex-col w-full mb-2">
                              <div className="text-xs text-gray-400 flex items-center justify-between w-full">
                                {quote.paperId === "0" ? (
                                  "Foreword"
                                ) : (
                                  <>
                                    <span>Paper {quote.paperId}</span>
                                    <span>
                                      Part {quote.paragraphNode.partId}
                                    </span>
                                  </>
                                )}
                              </div>
                              <h3 className="mt-1 text-sm font-bold leading-5 text-gray-600 dark:text-white">
                                {quote.paragraphNode.paperTitle}{" "}
                                <span className="text-xs text-gray-400 font-normal">
                                  ({quote.paragraphNode.standardReferenceId})
                                </span>
                              </h3>
                              {quote.paragraphNode.sectionTitle && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {quote.paragraphNode.sectionTitle}
                                </p>
                              )}
                            </div>

                            {/* Quote Text */}
                            <div className="flex-grow w-full overflow-hidden">
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                <div
                                  className="line-clamp-5"
                                  dangerouslySetInnerHTML={{
                                    __html: cleanHtml,
                                  }}
                                />
                                <span className="text-sm text-blue-400 absolute bottom-3 right-3">
                                  Read more
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {/* -- Papers In Progress --- */}
              {!fetchingProgress && papersInProgress?.length ? (
                <div className="mb-8 fade-in">
                  <h2 className="text-base mb-2 pb-2 text-center border-b text-gray-400 border-gray-200 dark:border-gray-600">
                    Continue Your Journey
                  </h2>

                  <p className="text-xs text-gray-400 mb-6">
                    Pick up where you left off in your exploration of the
                    papers.
                  </p>

                  {fetchingProgress ? (
                    <div className="flex justify-center items-center papers-row fade-in">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 papers-row fade-in">
                      {papersInProgress.map((paper) => {
                        // Find the progress result for the current paper and derive its completion status.
                        const progressResult = progressResults.find(
                          (progressResult) =>
                            progressResult?.paperId === paper.paperId
                        );

                        return (
                          <Link
                            className="relative flex flex-col items-start text-left justify-between px-4 py-2 mb-2 bg-white dark:bg-neutral-700 hover:dark:bg-neutral-600 rounded transition-colors hover:no-underline hover:shadow-lg hover:dark:shadow-none transition-shadow duration-300"
                            href={`/papers/${paperIdToUrl(`${paper.paperId}`)}`}
                            key={paper.globalId}
                          >
                            <div className="flex flex-col w-full">
                              {/* Top Row */}
                              <div className="text-xs text-gray-400 flex items-center justify-between w-full">
                                {paper.paperId === "0" ? (
                                  "Foreword"
                                ) : (
                                  <>
                                    <span>Paper {paper.paperId}</span>{" "}
                                    <span>Part {paper.partId}</span>
                                  </>
                                )}
                              </div>

                              {/* Paper Title */}
                              <h3 className="mt-1 text-lg font-bold leading-6 text-gray-600 dark:text-white">
                                {paper.paperTitle}
                              </h3>
                            </div>

                            <div className="flex flex-col w-full">
                              {/* Labels */}
                              <span
                                className="mt-1 text-xs text-gray-400 truncate w-full"
                                title={paper.labels.sort().join(" | ")}
                                dangerouslySetInnerHTML={{
                                  __html: highlightUserInterestLabels(
                                    paper.labels,
                                    userInterests
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
                  )}
                </div>
              ) : null}

              {/* Most Read Papers */}
              {!fetchingMostRead && mostReadPapers?.length ? (
                <div className="mb-8 fade-in">
                  <h2 className="text-base mb-2 pb-2 text-center border-b text-gray-400 border-gray-200 dark:border-gray-600">
                    Most Read Papers
                  </h2>

                  <p className="text-xs text-gray-400 mb-6">
                    Discover the papers that readers frequently return to.
                  </p>

                  {fetchingMostRead ? (
                    <div className="flex justify-center items-center fade-in">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-in">
                      {mostReadPapers.map((paper) => {
                        const progressResult = progressResults.find(
                          (result) => result?.paperId === paper.paperId
                        );
                        return (
                          <Link
                            key={paper.globalId}
                            href={`/papers/${paperIdToUrl(`${paper.paperId}`)}`}
                            className="relative flex flex-col items-start text-left justify-between px-4 py-2 mb-2 bg-white dark:bg-neutral-700 hover:dark:bg-neutral-600 rounded transition-colors hover:no-underline hover:shadow-lg hover:dark:shadow-none transition-shadow duration-300"
                          >
                            <div className="flex flex-col w-full">
                              <div className="text-xs text-gray-400 flex items-center justify-between w-full">
                                {paper.paperId === "0" ? (
                                  "Foreword"
                                ) : (
                                  <>
                                    <span>Paper {paper.paperId}</span>
                                    <span>Part {paper.partId}</span>
                                  </>
                                )}
                              </div>
                              <h3 className="mt-1 text-lg font-bold leading-6 text-gray-600 dark:text-white">
                                {paper.paperTitle}
                              </h3>
                            </div>
                            <div className="flex flex-col w-full">
                              <span
                                className="mt-1 text-xs text-gray-400 truncate w-full"
                                title={paper.labels.sort().join(" | ")}
                                dangerouslySetInnerHTML={{
                                  __html: highlightUserInterestLabels(
                                    paper.labels,
                                    userInterests
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
                  )}
                </div>
              ) : null}

              {/* Science Papers */}
              {!fetchingScience && sciencePapers?.length ? (
                <div className="mb-8 fade-in">
                  <h2 className="text-base mb-2 pb-2 text-center border-b text-gray-400 border-gray-200 dark:border-gray-600">
                    Science & Cosmology
                  </h2>

                  <p className="text-xs text-gray-400 mb-6">
                    Explore fascinating perspectives on physics, astronomy, and
                    the architecture of reality.
                  </p>

                  {fetchingScience ? (
                    <div className="flex justify-center items-center fade-in">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-in">
                      {sciencePapers.map((paper) => {
                        const progressResult = progressResults?.find(
                          (result) => result?.paperId === paper.paperId
                        );
                        return (
                          <Link
                            key={paper.globalId}
                            href={`/papers/${paperIdToUrl(`${paper.paperId}`)}`}
                            className="relative flex flex-col items-start text-left justify-between px-4 py-2 mb-2 bg-white dark:bg-neutral-700 hover:dark:bg-neutral-600 rounded transition-colors hover:no-underline hover:shadow-lg hover:dark:shadow-none transition-shadow duration-300"
                          >
                            <div className="flex flex-col w-full">
                              <div className="text-xs text-gray-400 flex items-center justify-between w-full">
                                <span>Paper {paper.paperId}</span>
                                <span>Part {paper.partId}</span>
                              </div>
                              <h3 className="mt-1 text-lg font-bold leading-6 text-gray-600 dark:text-white">
                                {paper.paperTitle}
                              </h3>
                            </div>
                            <div className="flex flex-col w-full">
                              <span
                                className="mt-1 text-xs text-gray-400 truncate w-full"
                                title={paper.labels.sort().join(" | ")}
                                dangerouslySetInnerHTML={{
                                  __html: highlightUserInterestLabels(
                                    paper.labels,
                                    userInterests
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
                  )}
                </div>
              ) : null}

              {/* Anthropology Papers */}
              {!fetchingAnthropology && anthropologyPapers?.length ? (
                <div className="mb-8 fade-in">
                  <h2 className="text-base mb-2 pb-2 text-center border-b text-gray-400 border-gray-200 dark:border-gray-600">
                    Human Origins & Development
                  </h2>

                  <p className="text-xs text-gray-400 mb-6">
                    Uncover the story of humanity&apos;s biological and cultural
                    evolution through the ages.
                  </p>

                  {fetchingAnthropology ? (
                    <div className="flex justify-center items-center fade-in">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-in">
                      {anthropologyPapers.map((paper) => {
                        const progressResult = progressResults.find(
                          (result) => result?.paperId === paper.paperId
                        );
                        return (
                          <Link
                            key={paper.globalId}
                            href={`/papers/${paperIdToUrl(`${paper.paperId}`)}`}
                            className="relative flex flex-col items-start text-left justify-between px-4 py-2 mb-2 bg-white dark:bg-neutral-700 hover:dark:bg-neutral-600 rounded transition-colors hover:no-underline hover:shadow-lg hover:dark:shadow-none transition-shadow duration-300"
                          >
                            <div className="flex flex-col w-full">
                              <div className="text-xs text-gray-400 flex items-center justify-between w-full">
                                <span>Paper {paper.paperId}</span>
                                <span>Part {paper.partId}</span>
                              </div>
                              <h3 className="mt-1 text-lg font-bold leading-6 text-gray-600 dark:text-white">
                                {paper.paperTitle}
                              </h3>
                            </div>
                            <div className="flex flex-col w-full">
                              <span
                                className="mt-1 text-xs text-gray-400 truncate w-full"
                                title={paper.labels.sort().join(" | ")}
                                dangerouslySetInnerHTML={{
                                  __html: highlightUserInterestLabels(
                                    paper.labels,
                                    userInterests
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
                  )}
                </div>
              ) : null}

              {/* After Life Papers */}
              {!fetchingAfterLife && afterLifePapers?.length ? (
                <div className="mb-8 fade-in">
                  <h2 className="text-base mb-2 pb-2 text-center border-b text-gray-400 border-gray-200 dark:border-gray-600">
                    Life Beyond Earth
                  </h2>

                  <p className="text-xs text-gray-400 mb-6">
                    Discover the adventure after mortal life and learn about the
                    beings that help us through our journey.
                  </p>

                  {fetchingAfterLife ? (
                    <div className="flex justify-center items-center fade-in">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-in">
                      {afterLifePapers.map((paper) => {
                        const progressResult = progressResults.find(
                          (result) => result?.paperId === paper.paperId
                        );
                        return (
                          <Link
                            key={paper.globalId}
                            href={`/papers/${paperIdToUrl(`${paper.paperId}`)}`}
                            className="relative flex flex-col items-start text-left justify-between px-4 py-2 mb-2 bg-white dark:bg-neutral-700 hover:dark:bg-neutral-600 rounded transition-colors hover:no-underline hover:shadow-lg hover:dark:shadow-none transition-shadow duration-300"
                          >
                            <div className="flex flex-col w-full">
                              <div className="text-xs text-gray-400 flex items-center justify-between w-full">
                                <span>Paper {paper.paperId}</span>
                                <span>Part {paper.partId}</span>
                              </div>
                              <h3 className="mt-1 text-lg font-bold leading-6 text-gray-600 dark:text-white">
                                {paper.paperTitle}
                              </h3>
                            </div>
                            <div className="flex flex-col w-full">
                              <span
                                className="mt-1 text-xs text-gray-400 truncate w-full"
                                title={paper.labels.sort().join(" | ")}
                                dangerouslySetInnerHTML={{
                                  __html: highlightUserInterestLabels(
                                    paper.labels,
                                    userInterests
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
                  )}
                </div>
              ) : null}

              {/* Parts Preview */}
              {nodes
                .filter((node) => node.type === "part")
                .sort((a, b) => parseInt(a.partId) - parseInt(b.partId))
                .map((part) => {
                  // Get first 3 papers of this part
                  const papers = nodes
                    .filter(
                      (node) =>
                        node.partId === part.partId &&
                        node.type === "paper" &&
                        node.paperId !== "0" // Exclude foreword
                    )
                    .slice(0, 3);

                  if (!papers.length) return null;

                  return (
                    <div key={part.globalId} className="mb-8 fade-in">
                      <h2 className="text-base mb-2 pb-2 text-center border-b text-gray-400 border-gray-200 dark:border-gray-600">
                        Part {part.partId} Papers
                      </h2>

                      <p className="text-xs text-gray-400 mb-6">
                        {part.partTitle}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {papers.map((paper) => {
                          // Find the progress result for the current paper
                          const progressResult = progressResults.find(
                            (result) => result?.paperId === paper.paperId
                          );

                          return (
                            <Link
                              key={paper.globalId}
                              href={`/papers/${paperIdToUrl(
                                `${paper.paperId}`
                              )}`}
                              className="relative flex flex-col items-start text-left justify-between px-4 py-2 mb-2 bg-white dark:bg-neutral-700 hover:dark:bg-neutral-600 rounded transition-colors hover:no-underline hover:shadow-lg hover:dark:shadow-none transition-shadow duration-300"
                            >
                              <div className="flex flex-col w-full">
                                <div className="text-xs text-gray-400 flex items-center justify-between w-full">
                                  <span>Paper {paper.paperId}</span>
                                  <span>Part {paper.partId}</span>
                                </div>
                                <h3 className="mt-1 text-lg font-bold leading-6 text-gray-600 dark:text-white">
                                  {paper.paperTitle}
                                </h3>
                              </div>
                              <div className="flex flex-col w-full">
                                <span
                                  className="mt-1 text-xs text-gray-400 truncate w-full"
                                  title={paper.labels.sort().join(" | ")}
                                  dangerouslySetInnerHTML={{
                                    __html: highlightUserInterestLabels(
                                      paper.labels,
                                      userInterests
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
                })}
            </div>
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
