import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PaperPage from "@/pages/papers/[paperName]";

// next/font/google is not available in jsdom.
vi.mock("next/font/google", () => ({
  Noto_Serif: () => ({ className: "noto-serif" }),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    asPath: "/papers/foreword",
    query: {},
    pathname: "/papers/[paperName]",
  }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "loading" }),
}));

vi.mock("react-screen-wake-lock", () => ({
  useWakeLock: () => ({
    isSupported: false,
    released: undefined,
    request: vi.fn(),
    release: vi.fn(),
  }),
}));

// Custom hooks: return shapes matching what the page destructures.
vi.mock("@/hooks/useFontSize", () => ({
  useFontSize: () => ({
    fontSize: "base",
    updateFontSize: vi.fn(),
    getFontSizeClasses: () => "",
  }),
}));

vi.mock("@/hooks/useModals", () => ({
  useModals: () => ({
    selectedGlobalIdExplain: null,
    setSelectedGlobalIdExplain: vi.fn(),
    selectedGlobalIdRelatedWorks: null,
    setSelectedGlobalIdRelatedWorks: vi.fn(),
    selectedGlobalIdShare: null,
    expandedGlobalId: null,
    setExpandedGlobalId: vi.fn(),
    onExplainClose: vi.fn(),
    onShareClick: () => vi.fn(),
    onShareClose: vi.fn(),
    onRelatedWorksClose: vi.fn(),
    onNodeSettingsClick: () => vi.fn(),
  }),
}));

vi.mock("@/hooks/useNotes", () => ({
  useNotes: () => ({
    notes: [],
    selectedGlobalIdNote: null,
    onNoteClick: () => vi.fn(),
    onNoteClose: vi.fn(),
  }),
}));

vi.mock("@/hooks/useBookmarks", () => ({
  useBookmarks: () => ({
    bookmarks: [],
    showBookmarkCategoryModal: false,
    setShowBookmarkCategoryModal: vi.fn(),
    selectedBookmark: null,
    setSelectedBookmark: vi.fn(),
    selectedNode: null,
    setSelectedNode: vi.fn(),
    handleCategorySelect: vi.fn(),
    onBookmarkClick: () => vi.fn(),
  }),
}));

vi.mock("@/hooks/useReadProgress", () => ({
  useReadProgress: () => ({
    readNodes: new Set(),
    markParagraphAsRead: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAudioPlayer", () => ({
  useAudioPlayer: () => ({
    isPlaying: false,
    isTransitioning: false,
    currentPlayingNode: null,
    playbackRate: 1,
    setPlaybackRate: vi.fn(),
    playAudio: vi.fn(),
    togglePlayPause: vi.fn(),
    skipToNextParagraph: vi.fn(),
    skipToPreviousParagraph: vi.fn(),
  }),
}));

vi.mock("@/libs/urantiaApi/client", () => ({
  fetchParagraphParallels: vi.fn(),
}));

// Stub heavy child components so we only test the page's own guard logic.
vi.mock("@/components/Spinner", () => ({
  default: () => <div data-testid="spinner">Loading</div>,
}));
vi.mock("@/components/HeadTag", () => ({ default: () => null }));
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/TopReadingNavbar", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/AskAI", () => ({ default: () => null }));
vi.mock("@/components/Note", () => ({ default: () => null }));
vi.mock("@/components/Share", () => ({ default: () => null }));
vi.mock("@/components/RelatedWorks", () => ({ default: () => null }));
vi.mock("@/components/BookmarkCategoryModal", () => ({ default: () => null }));

describe("PaperPage data guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a spinner instead of crashing when paperData is undefined", () => {
    // Reproduces the production crash: undefined is not an object (evaluating 'paperData.data').
    // This happens on client-side navigation when page props fail to load.
    expect(() =>
      render(<PaperPage paperData={undefined as any} />)
    ).not.toThrow();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("renders a spinner instead of crashing when results are empty", () => {
    // Reproduces the API-failure fallback path: getStaticProps returns { data: { results: [] } }.
    expect(() =>
      render(<PaperPage paperData={{ data: { results: [] } }} />)
    ).not.toThrow();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });
});
