// Node modules.
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
// Relative modules.
import Footer from "@/components/Footer";
import HeadTag from "@/components/HeadTag";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import LookupBox from "@/components/parallels/LookupBox";
import ParagraphCard from "@/components/parallels/ParagraphCard";
import ParallelsNote from "@/components/parallels/ParallelsNote";
import PassageCard from "@/components/parallels/PassageCard";
import { track } from "@/libs/analytics";
import {
  fetchCorpora,
  fetchParagraphWithParallels,
  searchParallels,
  type ApiCorpus,
  type SearchResults,
} from "@/libs/urantiaApi/parallels";
import { paragraphPath, passagePath, passageRefFromLabel } from "@/utils/parallels";

// Paragraphs from across the book, to show that any paragraph has parallels.
const FEATURED_REFS = ["2:1.2", "140:3.15", "48:7.13", "196:3.34", "100:4.6"];

// Paper 131 sections with their own texts, as a featured path.
const PAPER_131 = [
  { ref: "131:1.2", label: "Cynicism" },
  { ref: "131:2.2", label: "Judaism" },
  { ref: "131:3.2", label: "Buddhism" },
  { ref: "131:4.2", label: "Hinduism" },
  { ref: "131:7.2", label: "Shinto" },
  { ref: "131:8.2", label: "Taoism" },
  { ref: "131:9.2", label: "Confucianism" },
];

// The four insight lists.
const PATTERNS = [
  { href: "/explore/parallels/pairs", title: "Pairs that find each other", text: "A paragraph and a passage that are each other's closest match." },
  { href: "/explore/parallels/currents", title: "Shared currents", text: "Paragraphs close to many of the texts at once." },
  { href: "/explore/parallels/leans", title: "Where paragraphs lean", text: "Paragraphs much closer to one text than to the others." },
  { href: "/explore/parallels/far", title: "Far from these texts", text: "Paragraphs with no close passage in any text." },
];

type Featured = {
  ref: string;
  paperTitle: string;
  text: string;
  closest: { reference: string; religion: string } | null;
};

type ParallelsHomeProps = { corpora: ApiCorpus[]; featured: Featured[] };

const DESCRIPTION =
  "Read any paragraph of the Urantia Papers beside the closest passages in the scriptures of the world's religions, and follow the links from one to the next.";

const ParallelsHome = ({ corpora, featured }: ParallelsHomeProps) => {
  const router = useRouter();
  const q = typeof router.query.q === "string" ? router.query.q : "";
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const byId = new Map(corpora.map((c) => [c.id, c]));

  useEffect(() => {
    if (!q) {
      setResults(null);
      return;
    }
    let live = true;
    setSearching(true);
    setError("");
    searchParallels(q)
      .then((r) => {
        if (!live) return;
        setResults(r);
        track("parallels_searched", { kind: "results", count: r.paragraphs.length + r.passages.length });
      })
      .catch(() => live && setError("The search did not complete. Try again in a moment."))
      .finally(() => live && setSearching(false));
    return () => {
      live = false;
    };
  }, [q]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-gray-700 dark:bg-neutral-800 dark:text-white">
      <HeadTag
        titlePrefix={q ? "Parallels search" : "Parallels"}
        metaDescription={DESCRIPTION}
        canonicalUrl="https://www.urantiahub.com/explore/parallels"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Parallels",
          description: DESCRIPTION,
          url: "https://www.urantiahub.com/explore/parallels",
          isPartOf: { "@type": "WebSite", name: "UrantiaHub", url: "https://www.urantiahub.com" },
        }}
      />
      <Navbar />
      {/* ph-no-capture: no autocapture here; these pages send named events instead. */}
      <main className="ph-no-capture flex-grow container mx-auto px-4 mt-8 mb-16 max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-2">Parallels</h1>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
          Any paragraph of the Urantia Papers, beside the closest passages in the world&apos;s
          scriptures.
        </p>

        <LookupBox key={q} corpora={corpora} initial={q} />

        {q ? (
          <section className="mt-8" aria-live="polite">
            {searching && (
              <div className="py-8 flex justify-center">
                <Spinner />
              </div>
            )}
            {error && <p className="text-rose-500 text-sm text-center py-4">{error}</p>}
            {results && !searching && (
              <>
                <h2 className="text-lg font-bold mb-3">In the Urantia Papers</h2>
                {results.paragraphs.length ? (
                  <ul className="space-y-3 list-none p-0 m-0">
                    {results.paragraphs.map((p) => (
                      <ParagraphCard key={p.id} paragraph={p} />
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">No paragraphs found.</p>
                )}
                <h2 className="text-lg font-bold mt-8 mb-0">In the world&apos;s scriptures</h2>
                <ParallelsNote />
                {results.passages.length ? (
                  <ul className="space-y-3 list-none p-0 m-0">
                    {results.passages.map((p) => {
                      const corpus = byId.get(p.corpus.id) ?? p.corpus;
                      return (
                        <PassageCard
                          key={p.chunkId}
                          passage={{
                            key: p.chunkId,
                            href: passagePath(corpus.slug, passageRefFromLabel(p.reference, corpus.refPrefix)),
                            reference: p.reference,
                            title: corpus.title,
                            religion: corpus.religion,
                            translator: corpus.translator,
                            year: corpus.year,
                            text: p.text,
                            similarity: p.similarity,
                          }}
                        />
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">No passages found.</p>
                )}
              </>
            )}
          </section>
        ) : (
          <>
            <h2 className="text-lg font-bold mt-8 mb-3">Start anywhere</h2>
            <ul className="space-y-3 list-none p-0 m-0">
              {featured.map((f) => (
                <li key={f.ref}>
                  <Link
                    href={paragraphPath(f.ref)}
                    className="block rounded-lg bg-white dark:bg-neutral-700 p-4 hover:no-underline hover:shadow-lg hover:dark:shadow-none transition-shadow duration-300"
                  >
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{f.paperTitle}</span>
                      <span className="font-bold text-gray-700 dark:text-white">{f.ref}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mt-1.5 mb-0 line-clamp-4">
                      {f.text}
                    </p>
                    {f.closest && (
                      <div className="text-xs text-gray-400 mt-2">
                        Closest:{" "}
                        <span className="font-semibold text-gray-700 dark:text-white">
                          {f.closest.reference}
                        </span>{" "}
                        · {f.closest.religion}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="text-lg font-bold mt-8 mb-3">Patterns</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0 m-0">
              {PATTERNS.map((pattern) => (
                <li key={pattern.href}>
                  <Link
                    href={pattern.href}
                    className="block h-full rounded-lg bg-white dark:bg-neutral-700 p-4 hover:no-underline hover:shadow-lg hover:dark:shadow-none transition-shadow duration-300"
                  >
                    <div className="font-bold text-gray-700 dark:text-white">{pattern.title}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-1 mb-0">{pattern.text}</p>
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="text-lg font-bold mt-8 mb-1">Paper 131, side by side</h2>
            <p className="text-xs text-gray-400 mb-3">
              Ganid&apos;s collection of the world&apos;s religions, beside each religion&apos;s
              own texts.
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PAPER_131.map((s) => (
                <Link
                  key={s.ref}
                  href={paragraphPath(s.ref)}
                  className="whitespace-nowrap text-xs rounded-full border border-gray-200 dark:border-zinc-600 bg-white dark:bg-neutral-700 text-gray-600 dark:text-gray-200 px-3 py-1.5 hover:no-underline"
                >
                  {s.label} · {s.ref.split(".")[0]}
                </Link>
              ))}
            </div>

            <h2 className="text-lg font-bold mt-8 mb-2">The texts</h2>
            <ul className="rounded-lg bg-white dark:bg-neutral-700 px-4 list-none m-0">
              {corpora.map((c) => (
                <li
                  key={c.id}
                  className="py-3 border-b last:border-0 border-gray-200 dark:border-neutral-600"
                >
                  <div className="flex justify-between items-baseline gap-3">
                    <span className="text-sm text-gray-700 dark:text-white">{c.title}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{c.religion}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Tr. {c.translator}, {c.year} ·{" "}
                    <a href={c.sourceUrl} rel="noopener noreferrer" target="_blank" className="text-sky-600 dark:text-sky-400">
                      source
                    </a>
                  </div>
                </li>
              ))}
              <li className="py-3">
                <div className="flex justify-between items-baseline gap-3">
                  <span className="text-sm text-gray-700 dark:text-white">World English Bible</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">Judaism and Christianity</span>
                </div>
              </li>
            </ul>
            <p className="text-xs text-gray-400 mt-3">
              All texts are in the public domain. The links come from the{" "}
              <a href="https://docs.urantia.dev/scriptures" className="text-sky-600 dark:text-sky-400">
                urantia.dev API
              </a>
              .
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<ParallelsHomeProps> = async ({ res }) => {
  const [corpora, paragraphs] = await Promise.all([
    fetchCorpora(),
    Promise.all(FEATURED_REFS.map((ref) => fetchParagraphWithParallels(ref).catch(() => null))),
  ]);
  const featured: Featured[] = paragraphs.flatMap((p) => {
    if (!p) return [];
    const best = [...p.scriptureParallels].sort((a, b) => b.similarity - a.similarity)[0];
    return [
      {
        ref: p.standardReferenceId,
        paperTitle: p.paperTitle,
        text: p.text,
        closest: best ? { reference: best.reference, religion: best.corpus.religion } : null,
      },
    ];
  });
  // The texts and links change only when the API is reseeded.
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
  return { props: { corpora, featured } };
};

export default ParallelsHome;

