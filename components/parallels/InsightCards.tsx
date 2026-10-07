// Node modules.
import Link from "next/link";
// Relative modules.
import type { LeanItem, PairItem, ScoredItem } from "@/libs/urantiaApi/parallels";
import { paragraphPath, passagePath, passageRefFromLabel, percent, shortName } from "@/utils/parallels";

const card =
  "block rounded-lg bg-white dark:bg-neutral-700 p-4 hover:no-underline hover:shadow-lg hover:dark:shadow-none transition-shadow duration-300";

const ParagraphHead = ({ p }: { p: ScoredItem["paragraph"] }) => (
  <div className="flex justify-between gap-2 text-xs text-gray-400">
    <span className="truncate">{p.paperTitle}</span>
    <span className="font-bold text-gray-700 dark:text-white whitespace-nowrap">{p.standardReferenceId}</span>
  </div>
);

/** A paragraph with how close it is to the texts: shared currents and far from these texts. */
export const ScoredCard = ({ item, mode }: { item: ScoredItem; mode: "currents" | "far" }) => (
  <li>
    <Link href={paragraphPath(item.paragraph.standardReferenceId)} className={card}>
      <ParagraphHead p={item.paragraph} />
      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mt-1.5 mb-0 line-clamp-4">
        {item.paragraph.text}
      </p>
      <div className="text-xs text-gray-400 mt-2">
        {mode === "currents" ? (
          <>
            Close in <span className="font-semibold text-gray-700 dark:text-white">{item.textsClose} of 10</span> texts
            · closest: {item.closest.map((c) => shortName(c.corpus)).join(", ")}
          </>
        ) : (
          <>
            Nearest text: {item.closest[0] ? shortName(item.closest[0].corpus) : "none"}, at the{" "}
            {Math.round((item.closest[0]?.percentile ?? 0) * 100)}th percentile
          </>
        )}
      </div>
    </Link>
  </li>
);

/** A paragraph and a passage that are each other's best match. */
export const PairCard = ({ item }: { item: PairItem }) => {
  const c = item.corpus;
  const href =
    c.slug === "bible"
      ? passagePath("bible", item.passage.chunkId.replace(/-\d+$/, ""))
      : passagePath(c.slug, passageRefFromLabel(item.passage.reference, c.refPrefix));
  return (
    <li className="rounded-lg bg-white dark:bg-neutral-700 overflow-hidden">
      <Link href={paragraphPath(item.paragraph.standardReferenceId)} className="block p-4 hover:no-underline">
        <ParagraphHead p={item.paragraph} />
        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mt-1.5 mb-0 line-clamp-3">
          {item.paragraph.text}
        </p>
      </Link>
      <div className="flex items-center gap-2 px-4 text-xs text-gray-400" aria-hidden="true">
        <span className="flex-1 border-t border-gray-200 dark:border-neutral-600" />
        <span>each other&apos;s closest match · {percent(item.similarity)}</span>
        <span className="flex-1 border-t border-gray-200 dark:border-neutral-600" />
      </div>
      <Link href={href} className="block p-4 hover:no-underline">
        <div className="flex justify-between gap-2 text-xs text-gray-400">
          <span className="truncate">
            {c.title} · {c.religion}
          </span>
          <span className="font-bold text-gray-700 dark:text-white whitespace-nowrap">{item.passage.reference}</span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mt-1.5 mb-0 line-clamp-3">
          {item.passage.text}
        </p>
      </Link>
    </li>
  );
};

/** A paragraph that comes closest to one text, well above its usual level. */
export const LeanCard = ({ item }: { item: LeanItem }) => (
  <li>
    <Link href={paragraphPath(item.paragraph.standardReferenceId)} className={card}>
      <ParagraphHead p={item.paragraph} />
      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mt-1.5 mb-0 line-clamp-4">
        {item.paragraph.text}
      </p>
      <div className="text-xs text-gray-400 mt-2">
        Leans toward <span className="font-semibold text-gray-700 dark:text-white">{shortName(item.corpus)}</span>{" "}
        ({item.corpus.religion}), {Math.round(item.gap * 100)} points above its usual level
      </div>
    </Link>
  </li>
);
