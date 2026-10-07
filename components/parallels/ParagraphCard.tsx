// Node modules.
import Link from "next/link";
// Relative modules.
import type { ParallelParagraph } from "@/libs/urantiaApi/parallels";
import { paperIdToUrl } from "@/utils/paperFormatters";
import { paragraphPath, percent } from "@/utils/parallels";

type ParagraphCardProps = { paragraph: ParallelParagraph };

// A Urantia paragraph in a list. The card opens its parallels; a second link opens the reader.
const ParagraphCard = ({ paragraph: p }: ParagraphCardProps) => (
  <li className="rounded-lg bg-white dark:bg-neutral-700 p-4">
    <Link href={paragraphPath(p.standardReferenceId)} className="block hover:no-underline">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-gray-700 dark:text-white">{p.standardReferenceId}</span>
        <span className="rounded bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-300 px-2 py-0.5 text-xs">
          {percent(p.similarity)}
        </span>
      </div>
      <div className="text-xs text-gray-400 mt-0.5">{p.paperTitle}</div>
      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mt-2 mb-0 line-clamp-4">
        {p.text}
      </p>
    </Link>
    <Link
      href={`/papers/${paperIdToUrl(p.paperId)}#${p.id}`}
      className="inline-block mt-2 text-xs text-sky-600 dark:text-sky-400"
    >
      Read in context
    </Link>
  </li>
);

export default ParagraphCard;
