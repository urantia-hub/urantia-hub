// Node modules.
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
// Relative modules.
import Footer from "@/components/Footer";
import HeadTag from "@/components/HeadTag";
import Navbar from "@/components/Navbar";
import ParagraphCard from "@/components/parallels/ParagraphCard";
import ParallelsNote from "@/components/parallels/ParallelsNote";
import PassageCard from "@/components/parallels/PassageCard";
import Trail from "@/components/parallels/Trail";
import { track } from "@/libs/analytics";
import {
  NotFoundError,
  fetchParagraphWithParallels,
  fetchPassageWithParallels,
  type ParagraphWithParallels,
  type PassageWithParallels,
} from "@/libs/urantiaApi/parallels";
import { paperIdToUrl } from "@/utils/paperFormatters";
import { compareGroups, paragraphPath, passagePath, percent } from "@/utils/parallels";

const SITE = "https://www.urantiahub.com";

type PageProps =
  | { kind: "paragraph"; paragraph: ParagraphWithParallels }
  | { kind: "passage"; passage: PassageWithParallels; path: string };

const CompareView = ({ paragraph: p }: { paragraph: ParagraphWithParallels }) => {
  const groups = compareGroups(p);
  const [selected, setSelected] = useState(groups[0]?.id ?? "");
  const [expanded, setExpanded] = useState(false);
  const group = groups.find((g) => g.id === selected) ?? groups[0];
  const firstId = groups[0]?.id ?? "";
  const chipsRef = useRef<HTMLDivElement>(null);

  const select = (id: string) => {
    setSelected(id);
    const chip = chipsRef.current?.querySelector<HTMLElement>(`[data-id="${id}"]`);
    chip?.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: "smooth" });
  };

  // A new paragraph starts on its closest text, with the paragraph folded.
  useEffect(() => {
    setSelected(firstId);
    setExpanded(false);
    track("parallels_opened", { kind: "paragraph" });
  }, [p.standardReferenceId, firstId]);

  return (
    <>
      <article className="rounded-lg bg-white dark:bg-neutral-700 p-4 mt-4">
        <div className="text-xs text-gray-400">
          {p.paperTitle}
          {p.sectionTitle ? ` · ${p.sectionTitle}` : ""}
        </div>
        <h1 className="text-xl font-bold mt-0.5 mb-0">{p.standardReferenceId}</h1>
        <p className={`text-base leading-relaxed mt-2 mb-0 ${expanded ? "" : "line-clamp-6"}`}>{p.text}</p>
        <div className="flex justify-between text-sm mt-2">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="bg-transparent border-0 dark:border-0 p-0 text-sky-600 dark:text-sky-400"
          >
            {expanded ? "Show less" : "Read all"}
          </button>
          <Link href={`/papers/${paperIdToUrl(p.paperId)}#${p.id}`} className="text-sky-600 dark:text-sky-400">
            Read in context
          </Link>
        </div>
      </article>

      <h2 className="text-lg font-bold mt-6 mb-2">Closest passages</h2>
      <div ref={chipsRef} className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Texts">
        {groups.map((g) => {
          const on = g.id === group?.id;
          return (
            <button
              key={g.id}
              data-id={g.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => select(g.id)}
              className={`whitespace-nowrap text-xs rounded-full border px-3 py-1.5 ${
                on
                  ? "bg-sky-500 border-sky-500 text-white"
                  : "bg-white dark:bg-neutral-700 border-gray-200 dark:border-zinc-600 text-gray-600 dark:text-gray-200"
              }`}
            >
              {g.label} · {percent(g.items[0]?.similarity ?? 0)}
            </button>
          );
        })}
      </div>
      <ParallelsNote />
      <ul className="space-y-3 list-none p-0 m-0" role="tabpanel">
        {group?.items.map((item) => <PassageCard key={item.key} passage={item} />)}
      </ul>

      <div className="flex justify-between text-sm mt-6">
        {p.navigation.prev ? (
          <Link href={paragraphPath(p.navigation.prev)} className="text-sky-600 dark:text-sky-400">
            ‹ {p.navigation.prev}
          </Link>
        ) : (
          <span />
        )}
        {p.navigation.next && (
          <Link href={paragraphPath(p.navigation.next)} className="text-sky-600 dark:text-sky-400">
            {p.navigation.next} ›
          </Link>
        )}
      </div>
    </>
  );
};

const PassageView = ({ passage: s }: { passage: PassageWithParallels }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    track("parallels_opened", { kind: "passage", corpus: s.slug });
  }, [s.slug, s.passageRef]);

  const copyCitation = async () => {
    const citation = `${s.reference}, ${s.title}, translated by ${s.translator} (${s.year})`;
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the citation is on the page.
    }
  };

  return (
    <>
      <article className="rounded-lg bg-white dark:bg-neutral-700 p-4 mt-4">
        <div className="text-xs text-gray-400">
          {s.title} · {s.religion}
        </div>
        <h1 className="text-xl font-bold mt-0.5 mb-0">
          {s.reference}
          {s.divisionTitle && <span className="font-normal text-sm text-gray-400"> · {s.divisionTitle}</span>}
        </h1>
        <p className="text-base leading-relaxed mt-2 mb-0 whitespace-pre-line">{s.text}</p>
        <div className="text-xs text-gray-400 mt-3">
          Tr. {s.translator}, {s.year} · public domain
        </div>
        <button
          type="button"
          onClick={copyCitation}
          className="mt-3 bg-transparent border-0 dark:border-0 p-0 text-sm text-sky-600 dark:text-sky-400"
        >
          {copied ? "Copied" : "Copy citation"}
        </button>
      </article>

      <h2 className="text-lg font-bold mt-6 mb-0">Closest in the Urantia Papers</h2>
      <ParallelsNote />
      <ul className="space-y-3 list-none p-0 m-0">
        {s.urantiaParallels.map((p) => (
          <ParagraphCard key={p.id} paragraph={p} />
        ))}
      </ul>
    </>
  );
};

const ParallelsPage = (props: PageProps) => {
  const isParagraph = props.kind === "paragraph";
  const label = isParagraph ? props.paragraph.standardReferenceId : props.passage.reference;
  const href = isParagraph ? paragraphPath(props.paragraph.standardReferenceId) : props.path;
  const title = isParagraph
    ? `${label}, beside the world's scriptures`
    : `${label} (${props.passage.title}) beside the Urantia Papers`;
  const description = isParagraph
    ? `The passages in the world's scriptures closest in meaning to ${label} of the Urantia Papers.`
    : `The Urantia Papers paragraphs closest in meaning to ${label} of ${props.passage.title}, translated by ${props.passage.translator}.`;

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-gray-700 dark:bg-neutral-800 dark:text-white">
      <HeadTag titlePrefix={title} metaDescription={description} canonicalUrl={`${SITE}${href}`} />
      <Navbar />
      {/* ph-no-capture: no autocapture here; these pages send named events instead. */}
      <main className="ph-no-capture flex-grow container mx-auto px-4 mt-4 mb-16 max-w-2xl">
        <Trail href={href} label={label} />
        {props.kind === "paragraph" ? (
          <CompareView paragraph={props.paragraph} />
        ) : (
          <PassageView passage={props.passage} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ params, res }) => {
  const path = (params?.path as string[] | undefined) ?? [];
  try {
    let props: PageProps;
    if (path.length === 1 && /^\d{1,3}:\d{1,2}\.\d{1,3}$/.test(path[0] as string)) {
      props = { kind: "paragraph", paragraph: await fetchParagraphWithParallels(path[0] as string) };
    } else if (path.length === 2) {
      const [slug, ref] = path as [string, string];
      props = { kind: "passage", passage: await fetchPassageWithParallels(slug, ref), path: passagePath(slug, ref) };
    } else {
      return { notFound: true };
    }
    // The text and its links change only when the API is reseeded.
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
    return { props };
  } catch (error) {
    if (error instanceof NotFoundError) return { notFound: true };
    throw error;
  }
};

export default ParallelsPage;
