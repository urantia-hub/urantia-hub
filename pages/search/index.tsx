// Node modules.
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
// Relative modules.
import { renderLeadingText } from "@/utils/renderNode";
import HeadTag from "@/components/HeadTag";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";
import { track } from "@/libs/analytics";
import { paperIdToUrl } from "@/utils/paperFormatters";

const Search = () => {
  // Router.
  const { data: session } = useSession();
  const router = useRouter();

  // State.
  const [query, setQuery] = useState<string>("");
  const lastTrackedQuery = useRef<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [popularSearches, setPopularSearches] = useState<
    Array<{ searchQuery: string; count: number }>
  >([]);
  const [recentSearches, setRecentSearches] = useState<
    Array<{ searchQuery: string }>
  >([]);
  const [isLoadingSearches, setIsLoadingSearches] = useState(true);

  // On mount, set the query and search if there is a query.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Query params.
    const queryParams = new URLSearchParams(router.asPath.split(/\?/)[1]);
    const q = queryParams.get("q");
    if (q) {
      setQuery(q);
      search(q);
    }
  }, []);

  // Debounce function to delay the API call
  useEffect(() => {
    if (!query) {
      setResults([]);
      router.push(`/search`, undefined, {
        shallow: true,
      });
      return;
    }

    setIsWaiting(true);

    const delayDebounceFn = setTimeout(() => {
      if (query) {
        search(query);
      }
    }, 500); // 500 ms delay

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Fetch popular and recent searches on mount
  useEffect(() => {
    const fetchSearchData = async () => {
      setIsLoadingSearches(true);
      try {
        // Fetch popular searches
        const popularRes = await fetch("/api/searches/popular");
        const popularData = await popularRes.json();
        setPopularSearches(popularData);

        // Fetch recent searches if user is logged in
        if (session?.user) {
          const recentRes = await fetch("/api/searches/recent");
          const recentData = await recentRes.json();
          setRecentSearches(recentData);
        }
      } catch (error) {
        console.error("Failed to fetch searches:", error);
      } finally {
        setIsLoadingSearches(false);
      }
    };

    fetchSearchData();
  }, [session?.user]);

  const trackSearch = async (searchQuery: string, resultCount: number) => {
    try {
      await fetch("/api/searches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchQuery,
          resultCount,
        }),
      });
    } catch (error) {
      console.error("Failed to track search:", error);
    }
  };

  const search = async (searchQuery: string) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/urantia-book/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: searchQuery,
        }),
      });
      const data = await response.json();

      // Update the results
      setResults(data.data.results);
      setHasSearched(true);

      // Track the search
      await trackSearch(searchQuery, data.data.results.length);
      // Counts only. The search text is not sent to analytics. This function
      // can run twice for one search, so the same query is tracked once.
      if (lastTrackedQuery.current !== searchQuery) {
        lastTrackedQuery.current = searchQuery;
        track("search_performed", {
          result_count: data.data.results.length,
          query_length: searchQuery.length,
        });
      }

      // Update the query param in the URL
      if (router.query.q !== searchQuery) {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`, undefined, {
          shallow: true,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsWaiting(false);
    }
  };

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value.trimStart());
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && query) {
      search(query);
    }
  };

  const deriveSearchStatus = () => {
    if (!query) {
      return "";
    }

    if (!hasSearched) {
      return "";
    }

    if (isLoading) {
      return "Searching...";
    }

    if (results.length >= 1) {
      return `${results.length} result${results.length > 1 ? "s" : ""}`;
    }

    if (isWaiting) {
      return "";
    }

    return "Nothing found, try changing your search slightly";
  };

  const onClearSearch = () => {
    setQuery("");
    document.getElementById("search")?.focus();
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-gray-700 dark:bg-neutral-800 dark:text-white">
      <HeadTag
        metaDescription="Utilize UrantiaHub's search feature to find specific teachings, papers, or topics within The Urantia Papers, aiding your study and exploration."
        titlePrefix="Search"
        canonicalUrl="https://www.urantiahub.com/search"
      />

      <Navbar />

      <main className="mt-8 flex-grow container mx-auto px-4 my-4 max-w-3xl paper-content min-h-screen">
        <h1 className="text-2xl md:text-4xl dark:text-white font-bold mb-8 text-center">
          Search the Urantia Papers
        </h1>
        <div className="relative flex items-center w-full mb-6 pb-2">
          <input
            autoFocus
            className="w-full bg-white dark:bg-zinc-900 border-0 dark:border-0 text-gray-600 dark:text-white rounded focus:outline-none px-4 focus:shadow-lg transition duration-300 ease-in-out"
            id="search"
            onChange={handleSearchInput}
            onKeyDown={handleKeyPress}
            placeholder="Search..."
            type="text"
            value={query}
          />
          {query.includes(" ") && results.length > 1 && (
            <p className="text-gray-400 dark:text-gray-600 text-xs ml-2 absolute right-0 -bottom-3">
              Use double quotes (&quot;Urantia Papers&quot;) to search for exact
              phrases
            </p>
          )}
          <p className="text-gray-400 dark:text-gray-600 text-xs ml-2 absolute -left-2 -bottom-3">
            {deriveSearchStatus()}
          </p>
          {query && (
            <button
              aria-label="Clear search"
              className="absolute top-0.5 dark:-top-0.5 right-4 text-gray-400 dark:text-gray-400 text-xl border-0 dark:border-0 bg-transparent dark:bg-transparent focus:outline-none p-1 hover:text-gray-500 hover:dark:text-white transition-colors duration-200"
              onClick={onClearSearch}
              type="button"
            >
              &times;
            </button>
          )}
        </div>

        {isLoading && !results.length && (
          <div className="flex justify-center">
            <Spinner />
          </div>
        )}

        {/* Show suggestions when no search is active */}
        {!results.length && !query && (
          <div className="mt-6 space-y-8">
            {/* Search Tips */}
            <div className="bg-white dark:bg-neutral-700 rounded-lg p-6 shadow-sm fade-in">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                Search Tips
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 mt-[8px] bg-sky-500 rounded-full flex-shrink-0" />
                  <p>
                    Use quotes for exact phrases: <i>&quot;divine love&quot;</i>
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 mt-[8px] bg-sky-500 rounded-full flex-shrink-0" />
                  <p>
                    Use complete words: <i>&quot;divine&quot;</i> not{" "}
                    <i>&quot;divin&quot;</i>
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 mt-[8px] bg-sky-500 rounded-full flex-shrink-0" />
                  <p>
                    Search passages: <i>&quot;1:2.3&quot;</i> shows Paper 1,
                    Section 2, Paragraph 3
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 mt-[8px] bg-sky-500 rounded-full flex-shrink-0" />
                  <p>
                    Multiple words find paragraphs containing all terms:
                    <i>&quot;faith spirit truth&quot;</i>
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 mt-[8px] bg-sky-500 rounded-full flex-shrink-0" />
                  <p>
                    Case insensitive: <i>&quot;God&quot;</i> and{" "}
                    <i>&quot;god&quot;</i> give the same results
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 mt-[8px] bg-sky-500 rounded-full flex-shrink-0" />
                  <p>
                    Try searching for concepts:{" "}
                    <i>&quot;personality survival&quot;</i> or{" "}
                    <i>&quot;supreme being&quot;</i>
                  </p>
                </div>
              </div>
            </div>

            {/* Popular Searches - Only show if there are popular searches */}
            {!isLoadingSearches && popularSearches.length > 0 && (
              <div className="bg-white dark:bg-neutral-700 rounded-lg p-6 shadow-sm fade-in">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                  Popular Searches
                </h2>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map(({ searchQuery, count }) => (
                    <button
                      key={searchQuery}
                      onClick={() => {
                        setQuery(searchQuery);
                        search(searchQuery);
                      }}
                      className="p-1 px-2 m-0 text-gray-600 dark:text-white bg-slate-100 dark:bg-zinc-700 border-0 rounded shadow-sm hover:bg-slate-200 dark:hover:bg-zinc-600 transition-colors duration-300 ease-in-out"
                    >
                      {searchQuery}
                      <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500 group-hover:text-gray-500">
                        ({count})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches - Only show if user has recent searches */}
            {!isLoadingSearches && recentSearches.length > 0 && (
              <div className="bg-white dark:bg-neutral-700 rounded-lg p-6 shadow-sm fade-in">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                  {session?.user ? "Your Recent Searches" : "Recent Searches"}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(({ searchQuery }) => (
                    <button
                      key={searchQuery}
                      onClick={() => {
                        setQuery(searchQuery);
                        search(searchQuery);
                      }}
                      className="p-1 px-2 m-0 text-gray-600 dark:text-white bg-slate-100 dark:bg-zinc-700 border-0 rounded shadow-sm hover:bg-slate-200 dark:hover:bg-zinc-600 transition-colors duration-300 ease-in-out"
                    >
                      {searchQuery}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        <div className="flex flex-col">
          {results?.map((result) => (
            <Link
              aria-label="View paragraph in context"
              className="mb-6 text-left hover:no-underline isolated-quote"
              key={result.globalId}
              href={`/papers/${paperIdToUrl(`${result.paperId}`)}#${
                result.globalId
              }?q=${encodeURIComponent(query)}`}
            >
              <div className="leading-relaxed">
                <div className="flex flex-col block mb-1 text-gray-400 text-xs">
                  <span>{renderLeadingText(result)}</span>
                </div>
                <div
                  className="leading-tight max-h-96 overflow-y-auto text-gray-600 dark:text-white"
                  dangerouslySetInnerHTML={{
                    __html: result._highlightResult?.htmlText?.value as string,
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Search;
