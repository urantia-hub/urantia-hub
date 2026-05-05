// Node modules.
import Link from "next/link";
import {
  BookmarkIcon,
  Ellipsis,
  Link2,
  MessageSquareTextIcon,
  Pause,
  PlayIcon,
  Share2Icon as ShareIcon,
  Stars,
  X,
} from "lucide-react";
import { Note as NoteType, Bookmark } from "@prisma/client";
import { Noto_Serif } from "next/font/google";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useWakeLock } from "react-screen-wake-lock";
// Relative modules.
import AskAI from "@/components/AskAI";
import BookmarkCategoryModal from "@/components/BookmarkCategoryModal";
import Footer from "@/components/Footer";
import HeadTag from "@/components/HeadTag";
import Navbar from "@/components/Navbar";
import Note from "@/components/Note";
import RelatedWorks from "@/components/RelatedWorks";
import Share from "@/components/Share";
import Spinner from "@/components/Spinner";
import TopReadingNavbar from "@/components/TopReadingNavbar";
import {
  AUDIO_ENABLED,
  AUDIO_ENABLED_PAPER_IDS,
  PAPER_ID_TO_MP3_URL,
  SPOTIFY_EPISODE_IDS,
} from "@/utils/config";
import {
  getPaperIdFromPaperUrl,
  getValidPaperUrls,
  paperIdToUrl,
} from "@/utils/paperFormatters";
import { fetchParagraphParallels } from "@/libs/urantiaApi/client";
import type { ParagraphParallels } from "@/libs/urantiaApi/types";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useFontSize } from "@/hooks/useFontSize";
import { useModals } from "@/hooks/useModals";
import { useNotes } from "@/hooks/useNotes";
import { useReadProgress } from "@/hooks/useReadProgress";

const notoSerifFont = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
});

type PaperPageProps = {
  paperData: {
    data: {
      results: UBNode[];
    };
  };
};

const PaperPage = ({ paperData }: PaperPageProps) => {
  // Hooks.
  const router = useRouter();
  const { status } = useSession();
  const { isSupported, released, request, release } = useWakeLock({
    onRequest: () =>
      console.log(`[Screen Wake Lock]: Requested. Released: ${released}`),
    onError: (error) => console.log("[Screen Wake Lock]: Error", error),
    onRelease: () => console.log("[Screen Wake Lock]: Released"),
  });

  // TOC states.
  const [tocExpanded, setTOCExpanded] = useState<boolean>(false);

  // Sign-up prompt state.
  const [showSignUpPrompt, setShowSignUpPrompt] = useState<boolean>(false);

  // Get the nodes from the paper data.
  const nodes = paperData.data.results;

  // Get paper details.
  const paperId = nodes[0].paperId;
  const paperTitle = nodes[0].paperTitle;

  // Custom hooks.
  const { fontSize, updateFontSize, getFontSizeClasses } = useFontSize();
  const {
    selectedGlobalIdExplain, setSelectedGlobalIdExplain,
    selectedGlobalIdRelatedWorks, setSelectedGlobalIdRelatedWorks,
    selectedGlobalIdShare,
    expandedGlobalId, setExpandedGlobalId,
    onExplainClose,
    onShareClick, onShareClose,
    onRelatedWorksClose,
    onNodeSettingsClick,
  } = useModals();
  const { notes, selectedGlobalIdNote, onNoteClick, onNoteClose } = useNotes(paperId, status);
  const {
    bookmarks,
    showBookmarkCategoryModal, setShowBookmarkCategoryModal,
    selectedBookmark, setSelectedBookmark,
    selectedNode, setSelectedNode,
    handleCategorySelect,
    onBookmarkClick: hookOnBookmarkClick,
  } = useBookmarks(paperId, status);
  const { readNodes, markParagraphAsRead } = useReadProgress(paperId, paperTitle, nodes, status);
  const {
    isPlaying,
    isTransitioning,
    currentPlayingNode,
    playbackRate,
    setPlaybackRate,
    playAudio,
    togglePlayPause,
    skipToNextParagraph,
    skipToPreviousParagraph,
  } = useAudioPlayer(nodes, markParagraphAsRead);
  const paperIdNumber = parseInt(nodes[0].paperId);
  const nextPaperId = paperIdNumber < 196 ? paperIdNumber + 1 : null;

  // Calculate nodes for modals.
  const explainNode = selectedGlobalIdExplain
    ? nodes.find((node) => node.globalId === selectedGlobalIdExplain)
    : undefined;
  const noteNode = selectedGlobalIdNote
    ? nodes.find((node) => node.globalId === selectedGlobalIdNote)
    : undefined;
  const relatedWorksNode = selectedGlobalIdRelatedWorks
    ? nodes.find((node) => node.globalId === selectedGlobalIdRelatedWorks)
    : undefined;
  const shareNode = selectedGlobalIdShare
    ? nodes.find((node) => node.globalId === selectedGlobalIdShare)
    : undefined;

  // Cross-references modal: fetch parallels on demand, cache per globalId.
  const parallelsCacheRef = useRef<Map<string, ParagraphParallels>>(new Map());
  const [parallelsLoading, setParallelsLoading] = useState(false);
  const [parallelsError, setParallelsError] = useState("");
  const [activeParallels, setActiveParallels] = useState<ParagraphParallels | null>(null);

  useEffect(() => {
    if (!selectedGlobalIdRelatedWorks) {
      setActiveParallels(null);
      setParallelsError("");
      return;
    }
    const cached = parallelsCacheRef.current.get(selectedGlobalIdRelatedWorks);
    if (cached) {
      setActiveParallels(cached);
      return;
    }
    setParallelsLoading(true);
    setParallelsError("");
    fetchParagraphParallels(selectedGlobalIdRelatedWorks)
      .then((data) => {
        parallelsCacheRef.current.set(selectedGlobalIdRelatedWorks, data);
        setActiveParallels(data);
      })
      .catch((err: Error) => setParallelsError(err.message ?? "Failed to load"))
      .finally(() => setParallelsLoading(false));
  }, [selectedGlobalIdRelatedWorks]);

  // Wrap hookOnBookmarkClick to show toast with "Assign to category" button
  const onBookmarkClick = (node: UBNode) => {
    const hookHandler = hookOnBookmarkClick(node);
    return async () => {
      await hookHandler();
    };
  };

  // Show toast when a new bookmark is created (hook sets selectedBookmark/selectedNode)
  useEffect(() => {
    if (selectedBookmark && selectedNode) {
      const bookmark = selectedBookmark;
      const node = selectedNode;
      toast.success(
        <div className="flex items-center justify-between w-full">
          <span>Bookmark added! 🎉</span>
          <button
            className="border-0 px-3 py-1 text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-white rounded transition-colors shadow-sm text-sm"
            onClick={() => {
              setShowBookmarkCategoryModal(true);
            }}
          >
            Assign to category
          </button>
        </div>,
        {
          duration: 10000,
        }
      );
    }
  }, [selectedBookmark, selectedNode]);

  const findTopMostVisibleNode = (): HTMLElement | null => {
    const paragraphs = document.querySelectorAll(".paragraph");
    let topMostVisibleNode = null;
    let smallestPositiveTop = Infinity;

    paragraphs.forEach((paragraph) => {
      const rect = paragraph.getBoundingClientRect();
      if (rect.top >= 0 && rect.top < smallestPositiveTop) {
        smallestPositiveTop = rect.top;
        topMostVisibleNode = paragraph;
      }
    });

    return topMostVisibleNode;
  };

  const onSignUpClick = () => {
    // Get the top most visible node in the viewport.
    const topMostVisibleNode = findTopMostVisibleNode();

    // Set the callback URL.
    let callbackUrl = `/papers/${paperIdToUrl(`${paperId}`)}`;
    if (topMostVisibleNode) {
      callbackUrl += `#${topMostVisibleNode.id}`;
    }

    // Sign in.
    router.push(`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  useEffect(() => {
    console.log(`[Screen Wake Lock]: isSupported: ${isSupported}`);
    console.log(`[Screen Wake Lock]: Released: ${released}`);

    // Ensure the screen wake lock is requested when the component mounts
    if (isSupported) {
      void request();
    }

    // Ensure the screen wake lock is released when the component unmounts
    return () => {
      if (isSupported) {
        void release();
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Only show the sign-up prompt if the user is not authenticated,
      // the prompt is not hidden via sessionStorage, and the scroll position is over 400px
      const shouldShowPrompt =
        status === "unauthenticated" &&
        !sessionStorage.getItem("hideSignUpPrompt") &&
        window.scrollY > 400;

      setShowSignUpPrompt(shouldShowPrompt);
    };

    if (
      status === "unauthenticated" &&
      !sessionStorage.getItem("hideSignUpPrompt")
    ) {
      // Initially set the prompt based on the scroll position
      setShowSignUpPrompt(window.scrollY > 400);

      // Add scroll event listener
      window.addEventListener("scroll", handleScroll);
    }

    // Cleanup function to remove the event listener
    return () => window.removeEventListener("scroll", handleScroll);
  }, [status]);

  // Scroll to the hash on mount and highlight the query text if there is one.
  useEffect(() => {
    // Extracting the hash and query parameter from the URL.
    const [globalId, queryParam] =
      router.asPath.split("#")[1]?.split("?") || [];
    const queryParams = new URLSearchParams(queryParam);
    const query = queryParams.get("q");

    if (globalId) {
      const element = document.getElementById(globalId);
      if (element) {
        // Scroll to the element.
        const yOffset = -20;
        const y =
          element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y });

        // Highlight the query text, it's done this way because we don't want to replace the
        // raw HTML since it will destroy event listeners.
        const highlightQueryText = (element: any, query: string) => {
          const regex = new RegExp(query, "gi");

          const recurseAndHighlight = (node: any) => {
            if (node.nodeType === 3) {
              // Text node
              let match;
              while ((match = regex.exec(node.textContent)) !== null) {
                const highlightSpan = document.createElement("span");
                highlightSpan.className = "text-sky-400 underline";
                highlightSpan.textContent = match[0];

                const range = new Range();
                range.setStart(node, match.index);
                range.setEnd(node, match.index + match[0].length);

                range.deleteContents();
                range.insertNode(highlightSpan);
                range.setStartAfter(highlightSpan);
              }
            } else if (node.nodeType === 1) {
              // Element node
              Array.from(node.childNodes).forEach(recurseAndHighlight);
            }
          };

          recurseAndHighlight(element);
        };

        if (query) {
          highlightQueryText(element, query);
        }
      }
    }
  }, [router.asPath, router.query, router.pathname]);

  // Add copy event listener
  useEffect(() => {
    const handleCopy = (event: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || !selection.toString()) return;

      // Get selected text
      let text = selection.toString();

      // Remove "Explain |" and other UI elements from the selection
      text = text.replace(/Explain\n\|/g, "");
      // Format the text:
      text = text
        .replace(/\n+/g, "\n") // First consolidate all newlines
        .replace(/\((\d+:\d+(?:\.\d+)?)\)[\n\s]+/g, "($1) ") // Put reference IDs on same line as text
        .replace(/\n{3,}/g, "\n\n") // Ensure max 2 newlines between paragraphs
        .replace(/([IVX]+\. [^\n]+)\n+/g, "\n$1\n"); // Handle Roman numeral section headers

      // Prevent default copy behavior
      event.preventDefault();

      // Put formatted text on clipboard
      event.clipboardData?.setData("text/plain", text);
    };

    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, []);

  // Show a spinner until the content has loaded.
  if (!paperData) {
    return <Spinner />;
  }

  const onCopyPaper = () => {
    // Collect all the text from the nodes.
    const paperTextWithNodes = nodes
      .map((node) => {
        switch (node.type) {
          case "paper": {
            return `${
              parseInt(paperId) > 0
                ? `Paper ${paperId}: ${paperTitle}`
                : "Foreword"
            }\n`;
          }
          case "section": {
            return node.sectionTitle
              ? `\n${node.sectionTitle}\n\n`
              : `\nIntroduction\n\n`;
          }
          case "paragraph": {
            return `(${node.standardReferenceId}) ${node.text}\n`;
          }
        }
      })
      .join("");

    // Copy to clipboard.
    navigator.clipboard.writeText(paperTextWithNodes);

    // Show success toast.
    toast.success("Paper copied to clipboard! 🎉");
  };

  const renderNode = (node: UBNode) => {
    switch (node.type) {
      case "paper": {
        return (
          <div
            key={node.globalId}
            className={`${notoSerifFont.className} tracking-tight font-serif antialiased leading-relaxed mt-4 mb-4 text-center`}
          >
            {/* Paper Title */}
            {parseInt(node.paperId) > 0 && (
              <p className="mb-2 text-gray-600 dark:text-gray-400">
                {node.paperTitle}
              </p>
            )}

            {/* Paper Number */}
            <h1 className="text-5xl font-bold mb-6" id={node.globalId}>
              {parseInt(node.paperId) > 0 ? node.paperId : "Foreword"}
            </h1>

            {/* Small - XL Screen TOC */}
            <div className="flex flex-col items-left text-left xl:hidden mt-8">
              <h2
                className={`${
                  tocExpanded
                    ? "text-gray-600 dark:text-white"
                    : "text-gray-400"
                } text-sm flex items-center hover:text-gray-600 hover:dark:text-white transition-all duration-300 cursor-pointer`}
                onClick={() => setTOCExpanded(!tocExpanded)}
              >
                Table of Contents{" "}
                <svg
                  className={`w-6 h-6 ${
                    tocExpanded ? "-rotate-90" : "rotate-90"
                  }`}
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"
                  />
                </svg>
              </h2>
              {tocExpanded &&
                nodes.map((node: UBNode) =>
                  renderTOCNode(node, { skipPaperTitle: true })
                )}
            </div>
          </div>
        );
      }
      case "section": {
        if (!node.sectionTitle) return null;
        return (
          <div key={node.globalId} className="mt-16 mb-6 text-center">
            <h2
              className={`${notoSerifFont.className} tracking-tight font-serif antialiased leading-relaxed text-3xl font-bold`}
              id={node.globalId}
            >
              {node.sectionTitle}
            </h2>
          </div>
        );
      }
      case "paragraph": {
        const bookmark = bookmarks.find(
          (bookmark) => bookmark.globalId === node.globalId
        );
        const notesForNode = notes.filter(
          (note) => note.globalId === node.globalId
        );
        const isPlayingNode = currentPlayingNode === nodes.indexOf(node);

        return (
          <div
            className={`paragraph mb-2 text-left ${
              currentPlayingNode &&
              isPlayingNode &&
              (isPlaying || isTransitioning)
                ? "border-l-4 border-gray-200 dark:border-white pl-4 -ml-5"
                : ""
            }`}
            id={node.globalId}
            key={node.globalId}
          >
            <div
              className={`${notoSerifFont.className} tracking-tight font-serif antialiased text-lg leading-relaxed`}
            >
              <div
                className="flex items-center justify-between block text-gray-400 text-sm -mb-1.5"
                style={{ minHeight: "28px" }}
              >
                <div className="flex items-center">
                  <span
                    className={`fade-in flex items-center text-xs tracking-tighter`}
                  >
                    ({node.standardReferenceId}){" "}
                    {false && readNodes.has(node.globalId) && (
                      // Hiding the read indicator for now.
                      <svg
                        className="fade-in w-3.5 h-3.5 text-gray-400 ml-0.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          className="fill-current"
                          d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                        />
                      </svg>
                    )}
                  </span>
                </div>
                <div className="flex items-center select-none">
                  <div className="flex items-center mr-2">
                    {/* Explain Button */}
                    {expandedGlobalId === node.globalId && (
                      <button
                        aria-label="Explain"
                        className="flex items-center bg-transparent border-0 dark:border-0 p-0 dark:p-0 m-0 mr-3 focus:outline-0 focus:dark:outline-0 text-gray-400 dark:text-gray-400 text-sm hover:text-yellow-500 hover:dark:text-yellow-500 transition duration-300 ease-in-out fade-in"
                        onClick={() =>
                          setSelectedGlobalIdExplain(node.globalId)
                        }
                        type="button"
                      >
                        <Stars className="w-5 h-5" />{" "}
                        <span className="ml-1.5 text-base">Explain</span>
                      </button>
                    )}

                    {expandedGlobalId === node.globalId && (
                      <span className="mr-2 bg-gray-200 w-0.5 h-5 rounded-full" />
                    )}

                    {/* Audio Button */}
                    {AUDIO_ENABLED &&
                      AUDIO_ENABLED_PAPER_IDS.includes(node.paperId) &&
                      node.mp3Url &&
                      expandedGlobalId === node.globalId && (
                        <button
                          aria-label="Play"
                          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-white dark:bg-neutral-700 hover:dark:text-white border-0 rounded-full p-0 focus:outline-none transition duration-300 ease-in-out relative mr-2 fade-in"
                          onClick={() =>
                            currentPlayingNode === nodes.indexOf(node) &&
                            (isPlaying || isTransitioning)
                              ? togglePlayPause()
                              : playAudio(nodes.indexOf(node))
                          }
                          type="button"
                        >
                          {deriveAudioContent(nodes.indexOf(node), "5")}
                        </button>
                      )}

                    {/* Share Button */}
                    {expandedGlobalId === node.globalId && (
                      <button
                        aria-label="Share"
                        className="bg-transparent border-0 dark:border-0 p-0 dark:p-0 m-0 focus:outline-0 focus:dark:outline-0 text-gray-400 dark:text-gray-400 text-sm hover:text-gray-600 hover:dark:text-white transition duration-300 ease-in-out relative mr-2 fade-in"
                        onClick={onShareClick(node.globalId)}
                        type="button"
                      >
                        <ShareIcon className="w-5 h-5" />
                      </button>
                    )}

                    {/* Cross-references Button */}
                    {expandedGlobalId === node.globalId && (
                      <button
                        aria-label="Cross-references"
                        className="bg-transparent border-0 dark:border-0 p-0 dark:p-0 m-0 focus:outline-0 focus:dark:outline-0 text-gray-400 dark:text-gray-400 text-sm hover:text-sky-500 hover:dark:text-sky-400 transition duration-300 ease-in-out relative mr-2 fade-in"
                        onClick={() => setSelectedGlobalIdRelatedWorks(node.globalId)}
                        type="button"
                      >
                        <Link2 className="w-5 h-5" />
                      </button>
                    )}

                    {/* Notes Button */}
                    {status === "authenticated" &&
                      (expandedGlobalId === node.globalId ||
                        notesForNode.length > 0) && (
                        <button
                          aria-label="Notes"
                          className={`bg-transparent border-0 dark:border-0 p-0 dark:p-0 m-0 focus:outline-0 focus:dark:outline-0 text-gray-400 dark:text-gray-400 text-sm hover:text-orange-500 hover:dark:text-orange-500 transition duration-300 ease-in-out relative mr-2 fade-in ${
                            notesForNode.length > 0 ? "text-orange-500" : ""
                          }`}
                          onClick={onNoteClick(node.globalId)}
                          type="button"
                        >
                          <MessageSquareTextIcon className="w-5 h-5" />
                        </button>
                      )}

                    {/* Bookmark Button */}
                    {status === "authenticated" &&
                      (expandedGlobalId === node.globalId || bookmark) && (
                        <button
                          aria-label="Bookmark"
                          className={`bg-transparent border-0 dark:border-0 p-0 dark:p-0 m-0 focus:outline-0 focus:dark:outline-0 text-sm hover:text-emerald-400 hover:dark:text-emerald-400 transition duration-300 ease-in-out fade-in ${
                            bookmark
                              ? "text-emerald-400 dark:text-emerald-400"
                              : "text-gray-400 dark:text-gray-400"
                          }`}
                          onClick={onBookmarkClick(node)}
                          type="button"
                        >
                          {bookmark ? (
                            <BookmarkIcon className="w-5 h-5 fill-emerald-400" />
                          ) : (
                            <BookmarkIcon className="w-5 h-5" />
                          )}
                        </button>
                      )}
                  </div>

                  {/* Ellipsis button */}
                  {expandedGlobalId !== node.globalId && (
                    <button
                      aria-label="Settings"
                      className="bg-transparent border-0 dark:border-0 p-0 dark:p-0 m-0 focus:outline-0 focus:dark:outline-0 text-gray-400 dark:text-gray-400 text-sm hover:text-gray-600 hover:dark:text-white transition duration-300 ease-in-out fade-in"
                      onClick={onNodeSettingsClick(node.globalId)}
                      type="button"
                    >
                      <Ellipsis className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div
                className={`${getFontSizeClasses()} ${
                  currentPlayingNode &&
                  !isPlayingNode &&
                  (isPlaying || isTransitioning)
                    ? "text-gray-400"
                    : ""
                }`}
                onClick={onNodeSettingsClick(node.globalId, {
                  onlyOpen: true,
                })}
                onMouseDown={onNodeSettingsClick(node.globalId, {
                  onlyOpen: true,
                })}
              >
                <span
                  dangerouslySetInnerHTML={{ __html: node.htmlText as string }}
                />
              </div>
            </div>
          </div>
        );
      }
      default: {
        return null;
      }
    }
  };

  const deriveAudioContent = (
    nodeIndex?: number,
    size: string = "6"
  ): JSX.Element => {
    // If a node index is provided, we can determine if it's playing or not.
    if (typeof nodeIndex !== "undefined") {
      if (currentPlayingNode === nodeIndex && (isPlaying || isTransitioning)) {
        return (
          <Pause
            className={`w-${size} h-${size} fill-gray-400 stroke-transparent`}
          />
        );
      }

      return (
        <PlayIcon
          className={`w-${size} h-${size} fill-gray-400 stroke-transparent`}
        />
      );
    }

    // If no node index is provided, we can only determine if the audio is playing or not.
    if (isPlaying || isTransitioning) {
      return (
        <Pause
          className={`w-${size} h-${size} fill-gray-400 stroke-transparent`}
        />
      );
    }

    // Default to play icon.
    return (
      <PlayIcon
        className={`w-${size} h-${size} fill-gray-400 stroke-transparent`}
      />
    );
  };

  const renderTOCNode = (
    node: UBNode,
    options: { skipPaperTitle?: boolean } = {}
  ) => {
    switch (node.type) {
      case "paper": {
        if (options.skipPaperTitle) return null;
        return (
          <>
            <p className="text-xs text-gray-400">Paper {paperId}</p>
            <h2 className="m-0">{paperTitle}</h2>
          </>
        );
      }
      case "section": {
        return (
          <p className="text-sm mt-2 text-gray-400">
            <Link
              className="text-gray-400 hover:text-gray-600 hover:dark:text-white transition-all duration-300"
              href={node.sectionId === "0" ? "#" : `#${node.globalId}`}
            >
              {node.sectionTitle || "Introduction"}
            </Link>
          </p>
        );
      }
      default: {
        return null;
      }
    }
  };

  // Page content
  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-gray-700 dark:bg-neutral-800 dark:text-white">
      <HeadTag
        metaDescription={`${
          paperIdNumber > 0
            ? `Urantia Paper ${paperId} - ${paperTitle}`
            : "Urantia Papers Foreword"
        } - ${paperData.data.results[2].text}`}
        titlePrefix={
          paperIdNumber > 0 ? `Paper ${paperId} - ${paperTitle}` : "Foreword"
        }
        canonicalUrl={`https://www.urantiahub.com/papers/${paperIdToUrl(paperId)}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          "name": paperIdNumber > 0 ? `Paper ${paperId} - ${paperTitle}` : "Foreword",
          "description": `${
            paperIdNumber > 0
              ? `Urantia Paper ${paperId} - ${paperTitle}`
              : "Urantia Papers Foreword"
          } - ${paperData.data.results[2].text}`,
          "url": `https://www.urantiahub.com/papers/${paperIdToUrl(paperId)}`,
          "isPartOf": {
            "@type": "WebSite",
            "name": "UrantiaHub",
            "url": "https://www.urantiahub.com"
          }
        }}
      />

      <TopReadingNavbar
        onCopyPaper={onCopyPaper}
        watchUrl={`/watch/${paperIdToUrl(paperId)}`}
        spotifyUrl={
          SPOTIFY_EPISODE_IDS[paperId as keyof typeof SPOTIFY_EPISODE_IDS]
            ? `https://open.spotify.com/episode/${
                SPOTIFY_EPISODE_IDS[paperId as keyof typeof SPOTIFY_EPISODE_IDS]
              }`
            : undefined
        }
      />

      <Navbar
        audioContent={deriveAudioContent()}
        audioOnPlay={() =>
          isPlaying || isTransitioning
            ? togglePlayPause()
            : playAudio(currentPlayingNode || 0)
        }
        audioIsPlaying={isPlaying || isTransitioning}
        paperId={paperIdNumber}
        paperTitle={paperTitle}
        showAudio={AUDIO_ENABLED && AUDIO_ENABLED_PAPER_IDS.includes(paperId)}
        skipToNextParagraph={skipToNextParagraph}
        skipToPreviousParagraph={skipToPreviousParagraph}
        setPlaybackRate={setPlaybackRate}
        playbackRate={playbackRate}
      />

      {/* Conditional Sign-up Prompt */}
      {status === "unauthenticated" && showSignUpPrompt && (
        // purple box shadow
        <div className="z-10 fixed top-4 left-4 right-4 text-gray-600 bg-slate-50 dark:text-white dark:bg-neutral-900 p-4 rounded-lg text-sm pr-8 max-w-lg mx-auto fade-in shadow-lg shadow-purple-600/30 dark:shadow-purple-400/20">
          <p>
            Unlock handy features like bookmarking and notes.{" "}
            <button
              className="text-sky-600 dark:text-sky-400 hover:underline p-0 m-0 border-none bg-transparent focus:outline-none"
              onClick={onSignUpClick}
              type="button"
            >
              Sign in or create an account
            </button>
          </p>
          <button
            aria-label="Close sign-up prompt"
            className="absolute top-4 right-4 text-lg bg-transparent border-none p-0 m-0 focus:outline-none text-gray-400 hover:text-gray-600 hover:dark:text-white transition duration-300 ease-in-out"
            onClick={() => {
              sessionStorage.setItem("hideSignUpPrompt", "true");
              setShowSignUpPrompt(false);
            }}
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 122.878 122.88">
              <path d="M1.426 8.313a4.87 4.87 0 0 1 6.886-6.886l53.127 53.127 53.127-53.127a4.87 4.87 0 1 1 6.887 6.886L68.324 61.439l53.128 53.128a4.87 4.87 0 0 1-6.887 6.886L61.438 68.326 8.312 121.453a4.868 4.868 0 1 1-6.886-6.886l53.127-53.128L1.426 8.313z" />
            </svg>
          </button>
        </div>
      )}

      {/* Note Modal */}
      {selectedGlobalIdNote && <Note onClose={onNoteClose} node={noteNode} />}

      {/* Share Modal */}
      {selectedGlobalIdShare && (
        <Share onClose={onShareClose} node={shareNode} />
      )}

      {/* Cross-references Modal */}
      {selectedGlobalIdRelatedWorks && (
        <RelatedWorks
          node={relatedWorksNode}
          onClose={onRelatedWorksClose}
          urantiaParallels={activeParallels?.urantiaParallels ?? []}
          bibleParallels={activeParallels?.bibleParallels ?? []}
          loading={parallelsLoading}
          error={parallelsError}
        />
      )}

      {showBookmarkCategoryModal && (
        <BookmarkCategoryModal
          bookmark={selectedBookmark}
          node={selectedNode}
          onCategorySelect={handleCategorySelect}
          onClose={() => {
            setShowBookmarkCategoryModal(false);
            setSelectedBookmark(null);
            setSelectedNode(null);
          }}
        />
      )}

      {/* Add Explain Modal */}
      {selectedGlobalIdExplain && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onExplainClose}
        >
          <div
            className="bg-white dark:bg-neutral-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Explanation
              </h2>
              <button
                onClick={onExplainClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* Original Text */}
              <div className="p-4 bg-slate-100 dark:bg-neutral-900 rounded-lg mb-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Original Text:
                </p>
                <p
                  className="text-sm text-gray-900 dark:text-white"
                  dangerouslySetInnerHTML={{
                    __html: explainNode?.htmlText as string,
                  }}
                />
              </div>

              <AskAI
                selectedText={explainNode?.text}
                isModalOpen={selectedGlobalIdExplain === explainNode?.globalId}
                onClose={onExplainClose}
                node={explainNode}
                nodes={nodes}
              />
            </div>
          </div>
        </div>
      )}

      <main className="relative mt-16 flex-grow container mx-auto px-4 my-4 max-w-3xl paper-content">
        {/* Paper content */}
        <div className="mb-12 subpixel-antialiased">
          {nodes.map((node: UBNode) => renderNode(node))}
        </div>

        {/* Navigation links for previous and next papers */}
        <div className="flex justify-end text-right mb-12">
          {nextPaperId ? (
            <Link
              className="flex text-right text-gray-400 hover:text-gray-600 hover:dark:text-white transition duration-300 ease-in-out"
              href={`/papers/${paperIdToUrl(`${nextPaperId}`)}`}
            >
              Next{" "}
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"
                />
              </svg>
            </Link>
          ) : (
            <span />
          )}
        </div>

        {/* XL Screen TOC */}
        {tocExpanded ? (
          <div className="hidden rounded-lg xl:flex xl:flex-col fixed top-14 left-6 bg-white dark:bg-neutral-700/80 z-10 p-4 max-w-xs shadow-lg dark:shadow-none">
            <svg
              className={`w-6 h-6 ${
                tocExpanded ? "-rotate-90" : "rotate-90"
              } absolute top-2 right-2 cursor-pointer text-gray-400 hover:text-gray-600 dark:text-white dark:hover:text-white transition-all duration-300`}
              onClick={() => setTOCExpanded(!tocExpanded)}
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"
              />
            </svg>
            {nodes.map((node: UBNode) => renderTOCNode(node))}
          </div>
        ) : (
          <div
            aria-label="button"
            className="hidden rounded-lg xl:flex xl:flex-col fixed top-14 left-6 bg-white dark:bg-neutral-700/80 z-10 p-2 max-w-xs shadow-lg dark:shadow-none"
            onClick={() => setTOCExpanded(!tocExpanded)}
          >
            <svg
              className={`w-6 h-6 ${
                tocExpanded ? "-rotate-90" : "rotate-90"
              } cursor-pointer text-gray-400 hover:text-gray-600 dark:text-white dark:hover:text-white transition-all duration-300`}
              onClick={() => setTOCExpanded(!tocExpanded)}
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"
              />
            </svg>
          </div>
        )}
      </main>

      <Footer marginBottom="8.5rem" />
    </div>
  );
};

export async function getStaticProps(context: any) {
  const { paperName } = context.params as { paperName: string };

  // Get valid paper URLs.
  const validPaperUrls = getValidPaperUrls();

  // Check if the paperName is a valid paper URL.
  if (!validPaperUrls.includes(paperName)) {
    // If the paperName is a paperId, redirect to the correct URL.
    const paperId = Number(paperName);

    if (!isNaN(paperId) && paperId >= 0 && paperId <= 196) {
      const paperUrl = paperIdToUrl(String(paperId));
      return {
        redirect: {
          destination: `/papers/${paperUrl}`,
          permanent: true,
        },
      };
    }

    // If the paperName is not a valid paper URL, return a 404.
    return {
      notFound: true,
    };
  }

  const paperId = getPaperIdFromPaperUrl(paperName);
  if (Number.isNaN(paperId)) {
    return {
      notFound: true,
    };
  }

  const { fetchPaper } = await import("@/libs/urantiaApi/client");
  let paperData;
  try {
    paperData = await fetchPaper(String(paperId));
  } catch (error) {
    console.error(`[getStaticProps] Failed to fetch paper ${paperId}:`, error);
    return { props: { paperData: { data: { results: [] } } }, revalidate: 60 };
  }

  // Add mp3 file URLs for each node if there is one.
  paperData?.data?.results?.forEach((node: UBNode) => {
    if (PAPER_ID_TO_MP3_URL[node.paperId as keyof typeof PAPER_ID_TO_MP3_URL]) {
      node.mp3Url = `${
        PAPER_ID_TO_MP3_URL[node.paperId as keyof typeof PAPER_ID_TO_MP3_URL]
      }${node.globalId}.mp3`;
    }
  });

  return {
    props: {
      paperData,
    },
  };
}

export async function getStaticPaths() {
  // Only pre-render a small set at build time to avoid rate-limiting the API.
  // The rest are generated on-demand via fallback: "blocking".
  const prerenderedPaperIds = [0, 1, 2, 3, 4, 5];
  const paths = prerenderedPaperIds.map((paperId) => {
    const paperName = paperIdToUrl(String(paperId));
    return { params: { paperName } };
  });

  return {
    paths,
    fallback: "blocking",
  };
}

export default PaperPage;
